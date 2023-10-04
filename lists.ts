import uuid4 from "uuid4";

export interface CertListItem {
    name: string;
    link: string; // url
}

export const listBucketName = "lists";

export const certificateLists: CertListItem[] = [
    {
        "name": "lead-the-future",
        "link": process.env.LEAD_THE_FUTURE_LIST!
    }
]

export const makeListName = (name: string): string => {
    return `${name}-people.json`;
}

export const makeConfigName = (name: string): string => {
    return `${name}-config.json`;
}

export const makeImageName = (name: string): string => {
    return `${name}-image`;
}