import type { NextApiRequest, NextApiResponse } from 'next'
import formidable, { File } from "formidable";
import * as list from '@/lists';
import supabaseClient from '@/supabaseClient';
import * as fileService from '@/services/fileService';

type Data = {
    data?: string,
    error?: string
}

type ProcessedFiles = Array<[string, File]>;

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    if (req.method !== 'POST') {
        return res.status(400).json({error: `Only POST method is allowed`});
    }
    const listName = req.query.list as string || ''
    if (!listName) {
        return res.status(400).json({error: `Missing list name query`});
    }
    // TODO: make request to present lists

    const files = await new Promise<ProcessedFiles | undefined>((resolve, reject) => {
        const form = formidable();
        const files: ProcessedFiles = [];
        form.on('file', function (field, file) {
            files.push([field, file]);
        })
        form.on('end', () => resolve(files));
        form.on('error', err => reject(err));
        form.parse(req, () => {
        });
    }).catch(e => {
        console.log(e);
    });

    if (!files) {
        return res.status(400).json({error: `No files were uploaded`});
    } else if (files.length != 1) {
        return res.status(400).json({error: `Only one file is allowed`});
    } else {
        const [name, file] = files[0];
        if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
            return res.status(400).json({error: `Only png/jpeg files are allowed`});
        }

        // read the file from the filepath
        const { data, error }  = await fileService.uploadFile(listName, file);
        if (error) {
            return res.status(400).json({error: error.message});
        }
    }
    return res.status(200).json({data: `Successfully updated image for config list`});
}

export const config = {
    api: {
      bodyParser: false,
    },
  };