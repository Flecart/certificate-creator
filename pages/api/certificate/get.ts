import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from 'next/config'

import supabaseClient from '@/supabaseClient';

const { serverRuntimeConfig } = getConfig()

type Data = {
    data?: string,
    error?: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const id = req.query.id as string || ''

    try {
        const elementUrl = supabaseClient
            .storage
            .from(serverRuntimeConfig.supabaseBucket)
            .getPublicUrl(id)

        const respose = await fetch(elementUrl.data.publicUrl, {
            method: 'HEAD',
        });

        if (respose.status === 200) {
            return res.redirect(302, elementUrl.data.publicUrl);
        } else {
            return res.status(400).json({ error: "File not found" })
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