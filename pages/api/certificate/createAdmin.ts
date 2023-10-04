import type { NextApiRequest, NextApiResponse } from 'next'
import getConfig from 'next/config'
import crypto from 'crypto';

import { createHash } from 'crypto';
import {createPDF} from '@/pages/api/certificate/create'
import * as configService from '@/services/configService';
const { serverRuntimeConfig } = getConfig()

type Data = {
    error?: string
}
  
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data | Buffer>
) {

    const fullName = req.query.fullName as string || "";
    const keySuperUser = req.query.keySuperUser as string || "";
    const signerName = req.query.paramSignedSuperUser as string || "";
    const listName = req.query.listName as string || "";

    let name : string;

    if (!fullName) {
        return res.status(400).json({ error: 'Missing name' })
    }

    if (!listName) {
        return res.status(400).json({ error: 'Missing the name of the list for admin setting creation' })
    }

    if(signerName != "" && !verifySignature(fullName, serverRuntimeConfig.APICreateSuperUserKey, signerName )){
        return res.status(401).json({ error: 'Invalid signature for name ' + fullName})
    } 
    
    if (signerName == "" && keySuperUser !== serverRuntimeConfig.APICreateSuperUserKey) {
        return res.status(401).json({ error: 'Wrong key keySuperUser ' + keySuperUser })
    }

    const configResponse = await configService.getConfig(listName);
    if (configResponse.error) {
        return res.status(400).json({ error: configResponse.error.message })
    }

    name = fullName;

    try {
        const imageData = await createPDF(name, configResponse.data);

        res.setHeader('Content-Type', 'application/pdf');
        // TODO: change filename, should be put to config
        res.setHeader('Content-Disposition', `attachment; filename="LTF certificate 2023 - ${name}.pdf"`);
        res.send(imageData);
 
    } catch (error) {
        console.error(error);
        if (error instanceof Error) {
            return res.status(400).json({ error: error.message });
        } else {
            return res.status(400).json({ error: "Unknown error has occurred" });
        }
    }
}

function calculateMD5(input: string): string {
    return createHash('md5').update(input).digest('hex');
}

function verifySignature(message: string, secret: string, signature: string): boolean {
    const hash = crypto.createHmac('sha256', secret)
        .update(message)
        .digest('hex');

    return hash === signature;
}
