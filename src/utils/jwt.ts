import jwt from "jsonwebtoken";
import { JWT_EXPIRATION_TIME, JWT_SECRET } from "../environment";

const resolveSecret = (): jwt.Secret => {
    if (!JWT_SECRET) {
        throw new Error("Missing JWT_SECRET environment variable");
    }
    return JWT_SECRET as jwt.Secret;
};

const resolveExpiresIn = (): jwt.SignOptions["expiresIn"] => {
    if (!JWT_EXPIRATION_TIME) {
        throw new Error("Missing JWT_EXPIRATION_TIME environment variable");
    }
    return /^\d+$/.test(JWT_EXPIRATION_TIME)
        ? Number(JWT_EXPIRATION_TIME)
        : JWT_EXPIRATION_TIME as jwt.SignOptions["expiresIn"];
};

export const signJwt = (payload: string | Buffer | object): string => {
    const secret = resolveSecret();
    const expiresIn = resolveExpiresIn();
    return jwt.sign(payload, secret, { expiresIn });
};

