export interface CertificatePerson {
    name: string;
    username: string;
}

function isString(inputToCheck: string): boolean {
    return (typeof inputToCheck) === "string";
}

export function validatePerson(arr: any[]): boolean {
    arr.forEach((item) => {
        if (!isString(item.name) || !isString(item.username)) return false;
    })

    return true;
}