import { Request, Response } from "express";
import { getDao } from "../dao";
import { JWT_EXPIRATION_TIME, JWT_SECRET } from "../environment";
import { CustomError } from "../types/customError";
import { LogControllers_CustomResponse, LoginData, SessionUserData, Usuario } from "../types/types";
import { getCurrentDateTime } from "../utils/utils";
import { signJwt } from "../utils/jwt";

export const login = async (req: Request, res: Response) => {
    try {
        if (!JWT_SECRET || !JWT_EXPIRATION_TIME) throw new CustomError("Error interno del servidor, variable de entorno de login no disponible", 500);

        const loginData = req.body as LoginData;
        if (!loginData) throw new CustomError("No se enviaron las credenciales de login", 401);
 
        const fieldsRequired: Array<keyof Usuario> = ["password", "nombre", "permisos", "email", "habilitado", "id", "ciudad", "apellido"];               
        const response = await getDao().getTable({
            tableName: "usuario", 
            conditions: [{field: "email", value: loginData.email}], 
            fields: fieldsRequired,                                                                                            
        });  

        if (response.success && response.data && response.data.length) {
            const userData = response.data[0] as Usuario;
            if (userData.password !== loginData.password) throw new CustomError("Credenciales incorrectas", 401);
            if (userData.habilitado !== "1") throw new CustomError("Su cuenta se encuentra pendiente de habilitación", 401);  
            const isAdmin = userData.permisos === "10";
            const userDataForToken: SessionUserData = {
                name: userData.nombre, 
                lastName: userData.apellido,    
                email: userData.email, 
                registered: true, 
                rememberme: loginData.rememberme, 
                isAdmin: isAdmin, 
                userId: userData.id.toString(), 
                streamChatToken: "",
                city: userData.ciudad,
                token: "",
            };
            const token = signJwt(userDataForToken);
            userDataForToken.token = token;
            
            // Update last_activity_at after successful login
            await getDao().updateTable({
                tableName: "usuario",
                conditions: [{field: "id", value: userData.id}],
                data: {last_activity_at: getCurrentDateTime()}
            });
            
            res.status(200).json({success: true, data: userDataForToken, message: "Login correcto"} as LogControllers_CustomResponse);
        } else {
            throw new CustomError("Credenciales incorrectas", 401);
        }

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
        res.status(status).json({success: false, data: null, message: message} as LogControllers_CustomResponse);
    }
};   

export const isLogged = async (req: Request, res: Response) => {
    try {
        const userEmail = req.decoded?.email;
        if (!userEmail) throw new CustomError("Token inválido", 401);
      
        const fieldsRequired: Array<keyof Usuario> = ["password", "nombre", "permisos", "email", "habilitado", "id", "ciudad", "apellido"];               
        const response = await getDao().getTable({
            tableName: "usuario", 
            conditions: [{field: "email", value: userEmail}], 
            fields: fieldsRequired,                                                                                            
        });  
        if (response.success && response.data && response.data.length) {
            const userData = response.data[0] as Usuario;
            if (userData.habilitado !== "1") throw new CustomError("Su cuenta se encuentra pendiente de habilitación", 401);  
            const isAdmin = userData.permisos === "10";
            const userDataForToken: SessionUserData = {
                name: userData.nombre, 
                lastName: userData.apellido,
                email: userData.email, 
                registered: true, 
                rememberme: true, 
                isAdmin: isAdmin, 
                streamChatToken: "",
                userId: userData.id.toString(), city: userData.ciudad,
                token: "",
            };
            res.status(200).json({success: true, data: userDataForToken, message: ""} as LogControllers_CustomResponse);
        } else {
            throw new CustomError("Credenciales incorrectas", 401);
        }

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
        res.status(status).json({success: false, data: null, message: message} as LogControllers_CustomResponse);
    }
};   

export const logOut = async (_req: Request, res: Response) => {
    try {
        res.json({success: true, data: null, message: "Sesión cerrada correctamente"} as LogControllers_CustomResponse);
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        res.status(status).json({success: false, data: null, message: message} as LogControllers_CustomResponse);
    }
};   


