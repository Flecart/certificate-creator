import { StorageError } from '@supabase/storage-js';
import supabaseClient from '@/supabaseClient';
import * as list from '@/lists';
import { File } from "formidable";
import fs from 'fs';

export async function uploadFile(listName: string, file: File): Promise<
| {
    data: { name: string }
    error: null
  }
| {
    data: null
    error: StorageError
  }
> {

    const readFile = fs.readFileSync(file.filepath);
    const name = list.makeImageName(listName);
    const {data, error} = await supabaseClient
    .storage
    .from(list.listBucketName)
    .upload(name, readFile, {
        contentType: file.mimetype,
        upsert: true,
    });

    if (error) {
        return {data: null, error};
    }

    return {data: {name: name}, error: null};
}
