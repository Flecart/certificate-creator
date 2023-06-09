import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from 'next/config'

import uuid4 from "uuid4";
import pdfkit from 'pdfkit';
import blobStream from 'blob-stream';
import * as Buffer from 'node:buffer';
import path from "path"
import supabaseClient from '@/supabaseClient';
import fs from 'fs';

const { serverRuntimeConfig } = getConfig()

function createPDFBlob(name: string): Promise<Blob> {
    const doc = new pdfkit({
        margins : { // by default, all are 72, we don´t want margins
           top: 0,
           bottom:0,
           left: 0,
           right: 0
        },
        layout: 'landscape',
        size: [1080, 1920],
    });

    // write to fs
    // doc.pipe(fs.createWriteStream('output.pdf'));

    const stream = doc.pipe(blobStream());

    doc.image(path.resolve("./public", "nucleate-certificate.jpg"), {
        cover: [doc.page.width, doc.page.height],
    });
    
    // 595.28 x 841.89
    console.log(doc.page.width, doc.page.height);

    const widthStart = 1200;
    const heightStart = 820;
    const width = 600;
    const height = 80;
    let maxFontSize = 100;

    // Use this to debug the position of the rectangle
    // doc.polygon([widthStart, heightStart], [widthStart + width, heightStart], [widthStart + width, heightStart + height], [widthStart, heightStart + height]);
    // doc.stroke();

    doc.fontSize(maxFontSize);
    // -20 is set for spacing compatibility (its arbitrary value)
    while (doc.widthOfString(name, {lineBreak: false}) > width - 10 || doc.heightOfString(name) > height) {
        maxFontSize--;
        doc.fontSize(maxFontSize);
    }

    doc
    .font(path.resolve("./public/fonts", "Roobert-Regular.otf"))
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

async function createPDF(name: string): Promise<Buffer.Buffer> {
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
    const name = req.query.name as string || ''

    if (!name) {
        return res.status(400).json({ error: 'Missing name or surname' })
    }

    try {
        const id = uuid4();
        const imageData = await createPDF(name);
        const { data, error }  = await supabaseClient
            .storage
            .from('nucleate')
            .upload(`${id}.pdf`, imageData, {
                contentType: 'application/pdf',
                cacheControl: '3600',
                upsert: true,
        })

        if (error) {
            return res.status(400).json({ error: error.message })
        } else {
            const elementUrl = supabaseClient
                .storage
                .from('nucleate')
                .getPublicUrl(`${id}.pdf`)
            return res.status(200).json({ data: elementUrl.data.publicUrl });
        }

    } catch (error) {
        console.error(error)
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message })
          } else {
            return res.status(400).json({ error: "Unknown error has occurred" })
          }
    }
}