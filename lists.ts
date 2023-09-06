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