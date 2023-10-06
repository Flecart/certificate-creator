import type { NextApiRequest, NextApiResponse } from 'next'
import {createPDF} from '@/pages/api/certificate/create'
import * as configService from '@/services/configService';
import * as signatureService from '@/services/signatureService';
import { HttpError } from '@/models/errors';
import getConfig from 'next/config'
const { serverRuntimeConfig } = getConfig()

type Data = {
    error?: string
}
  
export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data | Buffer>
) {

    const fullName = req.query.fullName as string || "";
    const listName = req.query.listName as string || serverRuntimeConfig.defaultListName;
    // get year from query or current year
    const year = parseInt(req.query.year?.toString() || new Date().getFullYear().toString());

    // NOTE: a good design should move this to a decorator function.
    try {
        signatureService.tryQueryAuthCheck(req);
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({ error: error.message });
        } else {
            return res.status(400).json({ error: "Unknown error has occurred in auth checking" });
        }
    }

    let name : string;
    return res.status(400).json({ error: 'Scusate il disguido, avevamo creato il certificato ma non avevamo aggiornato il testo. Rimettiamo il sito online in 48h' })

    // if (!listName) {
    //     return res.status(400).json({ error: 'Missing the name of the list for admin setting creation' })
    // }

    // const configResponse = await configService.getConfig(listName);
    // if (configResponse.error) {
    //     return res.status(400).json({ error: configResponse.error.message })
    // }

    // name = fullName;

    // try {
    //     const imageData = await createPDF(name, configResponse.data, year);

    //     res.setHeader('Content-Type', 'application/pdf');
    //     // TODO: change filename, should be put to config
    //     res.setHeader('Content-Disposition', `attachment; filename="LTF certificate 2023 - ${name}.pdf"`);
    //     res.send(imageData);
 
    // } catch (error) {
    //     console.error(error);
    //     if (error instanceof Error) {
    //         return res.status(400).json({ error: error.message });
    //     } else {
    //         return res.status(400).json({ error: "Unknown error has occurred" });
    //     }
    // }
}
