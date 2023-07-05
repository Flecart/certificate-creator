import type { NextApiRequest, NextApiResponse } from 'next'

import { certificateLists, listBucketName, makeListName } from '@/lists';
import supabaseClient from '@/supabaseClient';
import { CertificatePerson, validatePerson } from '@/models/people';

type Data = {
    data?: string,
    error?: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const name = req.query.list as string || ''

    const currList = certificateLists.find((item) => item.name === name);

    if (!currList) {
        return res.status(404).json({error: `could not find ${name} list to update in our servers`});
    }

    try {
        const response = await fetch(currList.link);
        if (!response.ok) throw new Error("Unable to fetch the list from outside url");
        const bodyData = await response.json();

        if (!validatePerson(bodyData)) {
            throw new Error("Contact administrators, input array is in wrong format, can't update");
        }
        
        const certificatePersons = bodyData as CertificatePerson[];
        
        const { data, error }  = await supabaseClient
        .storage
        .from(listBucketName)
        .upload(makeListName(name), JSON.stringify(certificatePersons), {
            contentType: 'application/json',
            upsert: true,
        });

        if (error) throw new Error(error.message);
        else return res.status(200).json({data: `Successfully updated for ${name} list`});
    } catch(e: any) {
        return res.status(400).json({error: e.message ?? "Error in updating the messages, contact administrators"});
    }
}