import crypto from 'crypto';
import { createHash } from 'crypto';
import type { NextApiRequest } from 'next'
import { HttpError } from '@/models/errors';
import getConfig from 'next/config'
const { serverRuntimeConfig } = getConfig()

export function calculateMD5(input: string): string {
    return createHash('md5').update(input).digest('hex');
}

function verifySimpleMd5Signature(message: string, secret: string, signature: string): boolean {
    const hash = calculateMD5(message + secret);
    return hash === signature;
}

export function verifySignature(message: string, secret: string, signature: string): boolean {
    const hash = crypto.createHmac('sha256', secret)
        .update(message)
        .digest('hex');

    return hash === signature;
}

// when signature is not present, the secret should be super super secret (like a master key)
// this is used to authorize many settings, if you have real master you have access to everything
export function autorize(key: string, secret: string, signature: string | null): boolean {
    if (!signature) {
        return key === secret;
    }

    return verifySignature(key, secret, signature);
}

export function tryQueryAuthCheck(req: NextApiRequest): void { // throws HttpError
    const fullName = req.query.fullName as string || "";
    const keySuperUser = req.query.keySuperUser as string || "";
    const signedName = req.query.paramSignedSuperUser as string || "";
    const year = req.query.year as string || "";

    if (keySuperUser != "") {
        if (keySuperUser !== serverRuntimeConfig.APICreateSuperUserKey) {
            throw new HttpError(401, "Wrong key keySuperUser " + keySuperUser);
        }
    } else {
        if (!fullName) {
            throw new HttpError(400, "Missing name in name permission validation");
        }
    
        if(!verifySignature(fullName + year, serverRuntimeConfig.APICreateSuperUserKey, signedName)
            &&
        !verifySimpleMd5Signature(fullName + year, serverRuntimeConfig.APICreateSuperUserKey, signedName)) {
            throw new HttpError(401, "Invalid signature for name " + fullName);
        }
    }
}