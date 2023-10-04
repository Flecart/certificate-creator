import crypto from 'crypto';
import { createHash } from 'crypto';
import type { NextApiRequest } from 'next'
import { HttpError } from '@/models/errors';
import getConfig from 'next/config'
const { serverRuntimeConfig } = getConfig()

export function calculateMD5(input: string): string {
    return createHash('md5').update(input).digest('hex');
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
    const signerName = req.query.paramSignedSuperUser as string || "";

    if (signerName == "") {
        if (keySuperUser !== serverRuntimeConfig.APICreateSuperUserKey) {
            throw new HttpError(401, "Wrong key keySuperUser " + keySuperUser);
        }
    } else {
        if (!fullName) {
            throw new HttpError(400, "Missing name in name permission validation");
        }
    
        if(!verifySignature(fullName, serverRuntimeConfig.APICreateSuperUserKey, signerName )){
            throw new HttpError(401, "Invalid signature for name " + fullName);
        } 
    }
}