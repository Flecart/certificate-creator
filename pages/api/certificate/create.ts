import type { NextApiRequest, NextApiResponse } from 'next'

import uuid4 from "uuid4";
import pdfkit from 'pdfkit';
import blobStream from 'blob-stream';
import * as Buffer from 'node:buffer';
import { createClient } from '@supabase/supabase-js'
import path from "path"

function createPDFBlob(name: string): Promise<Blob> {
    const doc = new pdfkit({
        layout : 'landscape',
        margins : { // by default, all are 72, we don´t want margins
            top: 0,
           bottom:0,
            left: 0,
          right: 0
        },
    });

    const stream = doc.pipe(blobStream());

    doc.image(path.resolve("./public", "image.png"), {
        cover: [doc.page.width, doc.page.height],
    });

    doc
    .fontSize(25)
    .text(name,
        doc.page.width / 3, doc.page.height / 2, {
        width: doc.page.width / 3,
        align: 'center'
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
    const title = req.query.title as string || 'No Title'

    try {
        // Create a Supabase client with the Auth context of the logged in user.
        const supabaseClient = createClient(

            // Supabase API URL - env var exported by default.
            process.env['SUPABASE_URL'] ?? '',

            // Supabase API ANON KEY - env var exported by default.
            process.env['SUPABASE_ANON_KEY'] ?? '',

            // Create client with Auth context of the user that called the function.
            // This way your row-level-security (RLS) policies are applied.
            { global: { headers: { Authorization: req.cookies['Authorization'] ?? ''} } }
        )

        const id = uuid4();
        const imageData = await createPDF(title);
        const { data, error }  = await supabaseClient
            .storage
            .from('test')
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
                .from('test')
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