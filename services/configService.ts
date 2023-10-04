import { ConfigRequest } from '@/models/requests';
import { StorageError } from '@supabase/storage-js';
import supabaseClient from '@/supabaseClient';
import * as list from '@/lists';

export async function updateConfig(listName: string, config: ConfigRequest): Promise<
| {
    data: { path: string }
    error: null
  }
| {
    data: null
    error: StorageError
  }
> {
    return supabaseClient
    .storage
    .from(list.listBucketName)
    .upload(list.makeConfigName(listName), JSON.stringify(config), {
        contentType: 'application/json',
        upsert: true,
    });
}

export async function getConfig(listName: string): Promise<
| {
    data: ConfigRequest
    error: null
  }
| {
    data: null
    error: StorageError
  }
> {
    const {data, error} = await supabaseClient
    .storage
    .from(list.listBucketName)
    .download(list.makeConfigName(listName));

    if (error) {
        return {data: null, error};
    }

    const textData = (await data?.text()) || "{}";
    const config = JSON.parse(textData) as ConfigRequest;
    
    return {data: config, error: null};
}