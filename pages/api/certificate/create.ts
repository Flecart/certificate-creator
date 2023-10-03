import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from 'next/config'

import uuid4 from "uuid4";
import pdfkit from 'pdfkit';
import blobStream from 'blob-stream';
import * as Buffer from 'node:buffer';
import path from "path"
import supabaseClient from '@/supabaseClient';
import fs from 'fs';
import { listBucketName, makeListName } from '@/lists';
import { CertificatePerson } from '@/models/people';

const { serverRuntimeConfig } = getConfig()

function createPDFBlob(name: string, date: string = "2024"): Promise<Blob> {
    const doc = new pdfkit({
        margins : { // by default, all are 72, we don´t want margins
            top: 0,
           bottom:0,
            left: 0,
          right: 0
        },
        size: 'A4',
    });

    // write to fs
    // doc.pipe(fs.createWriteStream('output.pdf'));
    const stream = doc.pipe(blobStream());

    doc.image(path.resolve("./public", "certificato_mentee.jpg"), {
        cover: [doc.page.width, doc.page.height],
    });

    // position and size of the date
    const widthStartDate = 260;
    const heightStartDate = 238;
    const widthDate = 130;
    const heightDate = 70;
    const dateFontSize = 48;
    
    // Use this to debug the position of the text
    // doc.polygon([widthStartDate, heightStartDate], [widthStartDate + widthDate, heightStartDate], [widthStartDate + widthDate, heightStartDate + heightDate], [widthStartDate, heightStartDate + heightDate]);
    // doc.stroke();

    doc.fontSize(dateFontSize);
    doc.fillColor("#FFFFFF");
    doc
    .font(path.resolve("./public/fonts", "AtypDisplay-Semibold.otf"))
    .text(date,
        widthStartDate, heightStartDate, {
        width: widthDate,
        align: 'left'
    });
    doc.fillColor("#000000");

    // 595.28 x 841.89
    // console.log(doc.page.width, doc.page.height);

    const widthStart = 145;
    const heightStart = 435;
    const width = 310;
    const height = 30;
    let maxFontSize = 40;

    // Use this to debug the position of the rectangle
    // doc.polygon([widthStart, heightStart], [widthStart + width, heightStart], [widthStart + width, heightStart + height], [widthStart, heightStart + height]);
    // doc.stroke();

    doc.fontSize(maxFontSize);
    // -20 is set for spacing compatibility (its arbitrary value)
    while (doc.widthOfString(name, {lineBreak: false}) > width - 20 || doc.heightOfString(name) > height) {
        maxFontSize--;
        doc.fontSize(maxFontSize);
    }

    doc
    .font(path.resolve("./public/fonts", "AtypDisplay-Semibold.otf"))
    .text(name,
        widthStart, heightStart, {
        width: width,
        align: 'left'
    });
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

export async function createPDF(name: string): Promise<Buffer.Buffer> {
    const pdf = await createPDFBlob(name);
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
    const list = req.query.list as string || "";

    if (!username || !list) {
        return res.status(400).json({ error: 'Missing name or list query' })
    }

    const {data, error} = await supabaseClient
        .storage
        .from(listBucketName)
        .download(makeListName(list));

    if (error) {
        return res.status(400).json({ error: error.message })
    }

    const textData = (await data?.text()) || "[]";
    const persons = JSON.parse(textData) as CertificatePerson[];
    const personCertificate = persons.find((person) => person.username === username)

    if (!personCertificate) {
        return res.status(400).json({ error: "Person not found in list, you probably are not in the community, contact administrators if it's not correct" });
    }

    try {
        const id = username;
        const imageData = await createPDF(personCertificate.name);
        const { data, error }  = await supabaseClient
            .storage
            .from(serverRuntimeConfig.supabaseBucket)
            .upload(`${id}.pdf`, imageData, {
                contentType: 'application/pdf',
                upsert: true,
        })

        if (error) {
            return res.status(400).json({ error: error.message })
        } else {
            const elementUrl = supabaseClient
                .storage
                .from(serverRuntimeConfig.supabaseBucket)
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