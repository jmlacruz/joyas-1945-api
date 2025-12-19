import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { verifyTokenAPIError } from "../data/data";
import { JWT_SECRET, SESSION_IDLE_TIMEOUT_DAYS } from "../environment";
import { CustomError } from "../types/customError";
import { LogControllers_CustomResponse, SessionUserData, Usuario } from "../types/types";
import { getDao } from "../dao";
import { getCurrentDateTime } from "../utils/utils";

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {                            
        if (!JWT_SECRET) throw new CustomError("Error interno del servidor, variable de entorno de login no disponible", 500);

        const token = req.headers.authorization && req.headers.authorization.split(" ").length === 2 ? req.headers.authorization.split(" ")[1] : null;
        if (!token) {
            throw new CustomError("Acceso denegado, no se envió el token", 401);
        } else {
            const decoded = jwt.verify(token, JWT_SECRET) as SessionUserData;
            
            // Check idle session timeout
            const userResponse = await getDao().getTable({
                tableName: "usuario",
                conditions: [{field: "email", value: decoded.email}],
                fields: ["id", "last_activity_at"]
            });
            
            if (!userResponse.success || !userResponse.data || !userResponse.data.length) {
                throw new CustomError("Usuario no encontrado", 401);
            }
            
            const user = userResponse.data[0] as Usuario;
            const now = new Date();
            const currentDateTime = getCurrentDateTime();
            
            if (!user.last_activity_at) {
                // First activity - set last_activity_at to now
                await getDao().updateTable({
                    tableName: "usuario",
                    conditions: [{field: "id", value: user.id}],
                    data: {last_activity_at: currentDateTime}
                });
            } else {
                // Check if session has expired due to inactivity
                const lastActivity = new Date(user.last_activity_at);
                const daysSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
                
                if (daysSinceLastActivity > SESSION_IDLE_TIMEOUT_DAYS) {
                    // Session expired due to inactivity
                    throw new jwt.TokenExpiredError("Session expired due to inactivity", new Date());
                }
                
                // Update last_activity_at to current time
                await getDao().updateTable({
                    tableName: "usuario",
                    conditions: [{field: "id", value: user.id}],
                    data: {last_activity_at: currentDateTime}
                });
            }
            
            req.decoded = decoded;
            next();
        }
    } catch (err) {
        // Detectar si el error es específicamente por token inválido/expirado
        const isJwtError = err instanceof jwt.JsonWebTokenError || 
                          err instanceof jwt.TokenExpiredError || 
                          err instanceof jwt.NotBeforeError;
        
        let message: string;
        let status: number;
        
        if (isJwtError) {
            // Token inválido o sesión expirada por inactividad - indicar al cliente que debe cerrar sesión
            message = "TOKEN_INVALID";
            status = 401;
            console.error(`${verifyTokenAPIError}: Token inválido o expirado - ${err.message} - (verifyToken)`);
        } else if (err instanceof CustomError) {
            // Error personalizado (ej: no se envió token, usuario no encontrado)
            message = `${verifyTokenAPIError}: ${err.message}`;
            status = err.status;
            console.error(`${message} - (verifyToken)`);
        } else {
            // Otros errores
            message = `${verifyTokenAPIError}: ${err instanceof Error ? err.message : err}`;
            status = 500;
            console.error(`${message} - (verifyToken)`);
        }
        
        res.status(status).json({ 
            success: false, 
            data: null, 
            message: message,
            // Agregar flag específico para indicar que debe cerrar sesión
            shouldLogout: isJwtError
        } as LogControllers_CustomResponse & { shouldLogout?: boolean });
    }
};
