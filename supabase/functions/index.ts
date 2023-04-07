// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'std/server'

// @deno-types="npm:@types/pdfkit"
import pdfkit from 'npm:pdfkit';
// @deno-types="npm:@types/blob-stream"
import blobStream from 'npm:blob-stream';
// @deno-types="node:buffer"
import * as Buffer from 'node:buffer';
import { createClient } from '@supabase/supabase-js'
import "dotenv/load.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
}

function createPDFBlob(): Promise<Blob> {
    const doc = new pdfkit({
        layout : 'landscape',
        margins : { // by default, all are 72
            top: 0,
           bottom:0,
            left: 0,
          right: 0
        },
    });

    const stream = doc.pipe(blobStream());

    doc.image('./image.png', {
        cover: [doc.page.width, doc.page.height],
    });

    doc
    .fontSize(25)
    .text('Nome Figo', // TODO: poi modificare inserendo il nome
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

async function createPDF(): Promise<Buffer.Buffer> {
    const pdf = await createPDFBlob();
    const chunks = [];
    for await (const chunk of pdf.stream()) {
        chunks.push(Buffer.Buffer.from(chunk));
    }

    return Buffer.Buffer.concat(chunks);
}

serve(async (req: Request) => {
    const { url, method } = req

    try {
        // Create a Supabase client with the Auth context of the logged in user.
        const supabaseClient = createClient(

        // Supabase API URL - env var exported by default.
        Deno.env.get('SUPABASE_URL') ?? '',

        // Supabase API ANON KEY - env var exported by default.
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',

        // Create client with Auth context of the user that called the function.
        // This way your row-level-security (RLS) policies are applied.
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // For more details on URLPattern, check https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API
        const taskPattern = new URLPattern({ pathname: '/certificate/:id' })
        const matchingPath = taskPattern.exec(url)
        const id = matchingPath ? matchingPath.pathname.groups.id : null

        if (method === 'POST' || method === 'PUT') {
            // TODO: questo campo body sarà utilizzato per prendere i parametri per la creazione del pdf e poi fare il check.
            const body = await req.json()
        }

        const imageData = await createPDF();
        const { data, error }  = await supabaseClient
            .storage
            .from('test')
            .upload('test.pdf', imageData, {
                contentType: 'application/pdf',
                cacheControl: '3600',
                upsert: true,
        })

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        } else {
            return new Response(JSON.stringify({ data: data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

    } catch (error) {
        console.error(error)

        return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
        })
    }
})