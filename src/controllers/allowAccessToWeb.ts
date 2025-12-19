import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getDao } from "../dao";
import { CURRENT_FRONT_BASE_URL, JWT_EXPIRATION_TIME, JWT_SECRET } from "../environment";
import { getStreamChatToken } from "../services/getStream";
import { CustomError } from "../types/customError";
import { DatabaseControllers_CustomResponse, SessionUserData, Usuario } from "../types/types";
import { getCurrentDateTime } from "../utils/utils";

export const allowAccessToWeb = async (req: Request, res: Response) => {
    try {
        if (!JWT_SECRET || !JWT_EXPIRATION_TIME || !CURRENT_FRONT_BASE_URL) throw new CustomError("Error interno del servidor, variable de entorno de login no disponible", 500);
        if (!req.decoded || (req.decoded && !req.decoded.email)) throw new CustomError("No se pudo obtener el email del usuario en el token enviado, para darle acceso a la web", 401);
        const userEmail = req.decoded.email;
        const {pathName} = req.query;
        
        const fieldsRequired: Array<keyof Usuario> = ["nombre", "permisos", "email", "habilitado", "id", "ciudad", "apellido"];               
        const response = await getDao().getTable({
            tableName: "usuario", 
            conditions: [{field: "email", value: userEmail}], 
            fields: fieldsRequired,                                                                                            
        }); 
        if (response.success && response.data && response.data.length) {
            const userData = response.data[0] as Usuario;
            if (userData.habilitado !== "1") {
                return (res.status(401).send("Acceso a la web no autorizado. Su cuenta se encuentra deshabilitada"));
            } 
            const isAdmin = userData.permisos === "10";
            const userDataForToken: SessionUserData = {
                name: userData.nombre, 
                lastName: userData.apellido,
                email: userData.email, 
                registered: true, 
                rememberme: true, 
                isAdmin: isAdmin, 
                streamChatToken: getStreamChatToken({userId: userData.id.toString()}),
                userId: userData.id.toString(), city: userData.ciudad,
                token: "",
            };
            const token = jwt.sign(userDataForToken, JWT_SECRET, {expiresIn: JWT_EXPIRATION_TIME});
            
            // Update last_activity_at after successful token creation
            await getDao().updateTable({
                tableName: "usuario",
                conditions: [{field: "id", value: userData.id}],
                data: {last_activity_at: getCurrentDateTime()}
            });
            
            res.status(200).redirect(`${CURRENT_FRONT_BASE_URL}${ pathName ? "/" + pathName + "?token=" + token : "?token=" + token}`);
        } else {
            throw new CustomError("Credenciales incorrectas", 401);
        }

        return;

    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);

        return;
    }
};