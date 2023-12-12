import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from 'next/config'

import uuid4 from "uuid4";
import pdfkit, { write } from 'pdfkit';
import blobStream from 'blob-stream';
import * as Buffer from 'node:buffer';
import path from "path"
import supabaseClient from '@/supabaseClient';
import fs from 'fs';
import { CertificatePerson } from '@/models/people';
import { ConfigRequest, FontPosition } from '@/models/requests';
import * as configService from '@/services/configService';
import * as list from '@/lists';

const { serverRuntimeConfig } = getConfig()

function writeText(doc: PDFKit.PDFDocument, text: string, position: FontPosition, debug: boolean = false) {
    const {fontWidth, position: {x, y}, boxLength} = position;
    const fontSize = fontWidth;
    const width = boxLength;
    if (debug) {
        doc.polygon([x, y], [x + width, y], [x + width, y + fontSize], [x, y + fontSize]);
        doc.stroke();
    }

    doc.fontSize(fontSize);
    doc.text(text, x, y, {
        width: width,
        align: 'left'
    });
}

async function createPDFBlob(name: string, config: ConfigRequest, year: number | null = null): Promise<Blob> {

    if (year === null) {
        year = config.pdfconfig.date.year;
    }

    const doc = new pdfkit({
        margins : { // by default, all are 72, we don´t want margins
            top: 0,
           bottom:0,
            left: 0,
          right: 0w
        },
        size: 'A4',
    });
    
    doc.font(path.resolve("./public/fonts", "AtypDisplay-Semibold.otf"));

    // write to fs
    // doc.pipe(fs.createWriteStream('output.pdf'));
    const stream = doc.pipe(blobStream());

    // get image from supabase and config
    const imageResponse = await supabaseClient
        .storage
        .from(list.listBucketName)
        .download(list.makeImageName(config.bucketName));

    if (imageResponse.error) {
        throw imageResponse.error;
    }

    doc.image(await imageResponse.data.arrayBuffer(), {
        cover: [doc.page.width, doc.page.height],
    });

    doc.fillColor("#FFFFFF");
    writeText(doc, year.toString(), config.pdfconfig.date.fontPosition);
    doc.fillColor("#000000");

    // 595.28 x 841.89
    // console.log(doc.page.width, doc.page.height);

    const width = config.pdfconfig.name.fontPosition.boxLength;
    let maxFontSize = config.pdfconfig.name.fontPosition.fontWidth;
    doc.fontSize(maxFontSize);
    // -20 is set for spacing compatibility (its arbitrary value)
    while (doc.widthOfString(name, {lineBreak: false}) > width - 20) {
        maxFontSize--;
        doc.fontSize(maxFontSize);
    }
    config.pdfconfig.name.fontPosition.fontWidth = maxFontSize;

    writeText(doc, name, config.pdfconfig.name.fontPosition);
    doc.end();

    return new Promise<Blob>((resolve, reject) => {
        stream.on('finish', () => {
            const blob = stream.toBlob('application/pdf');
            resolve(blob);
        });
        stream.on('error', (err) => {
            reject(err);
        });
    });
}

export async function createPDF(name: string, config: ConfigRequest, year: number | null = null): Promise<Buffer.Buffer> {
    const pdf = await createPDFBlob(name, config, year);
    const chunks = [];
    // @ts-ignore Type 'ReadableStream<Uint8Array>' is not an array type or a string type.
    for await (const chunk of pdf.stream()) {
        chunks.push(Buffer.Buffer.from(chunk));
    }

    return Buffer.Buffer.concat(chunks)
}

type Data = {
    data?: string,
    error?: string
}
  
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const username = req.query.username as string || "";
    const listNmae = req.query.list as string || "";

    if (!username || !list) {
        return res.status(400).json({ error: 'Missing name or list query' })
    }

    const {data, error} = await supabaseClient
        .storage
        .from(list.listBucketName)
        .download(list.makeListName(listNmae));
    if (error) {
        return res.status(400).json({ error: error.message })
    }

    const configResponse = await configService.getConfig(listNmae);
    if (configResponse.error) {
        return res.status(400).json({ error: configResponse.error.message })
    }
    const configData = configResponse.data;

    const textData = (await data?.text()) || "[]";
    const persons = JSON.parse(textData) as CertificatePerson[];
    const personCertificate = persons.find((person) => person.username === username)

    if (!personCertificate) {
        return res.status(400).json({ error: "Person not found in list, you probably are not in the community, contact administrators if it's not correct" });
    }

    try {
        const id = username;
        const imageData = await createPDF(personCertificate.name, configData);
        const { data, error }  = await supabaseClient
            .storage
            .from(configData.bucketName)
            .upload(`${id}.pdf`, imageData, {
                contentType: 'application/pdf',
                upsert: true,
        })

        if (error) {
            return res.status(400).json({ error: error.message })
        } else {
            const elementUrl = supabaseClient
                .storage
                .from(configData.bucketName)
                .getPublicUrl(`${id}.pdf`)
            return res.redirect(302, elementUrl.data.publicUrl);
        }

    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message });
          } else {
            return res.status(400).json({ error: "Unknown error has occurred" });
          }
    }
}