import { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken";
import { JWT3_SECRET } from "../environment";
import { CustomError } from "../types/customError";
import { LogControllers_CustomResponse, SessionUserData } from "../types/types";

export const verifyTokenForEmailLinkAction = (req: Request, res: Response, next: NextFunction) => {
    if (!JWT3_SECRET) throw new CustomError("Error interno del servidor, variable de entorno para acciones con links en emails (JWT3_SECRET) no disponible", 500);
    
    const token = req.query.token as string;
    
    if (!token) {
        throw new CustomError ("Acceso denegado, no se envió el token", 401);
    } else {
        try {
            const decoded = jwt.verify(token, JWT3_SECRET) as SessionUserData;              //En este caso el token solo contiene el objeto {email: string}
            req.decoded = decoded;
            next();
        } catch (err) {
            const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
            const status = err instanceof CustomError ? err.status : 500;
            res.status(status).json({success: false, data: null, message: message} as LogControllers_CustomResponse);
        }
    }
};
