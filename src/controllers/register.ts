import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { CURRENT_API_BASE_URL, JWT3_SECRET } from "../environment";
import { sendMails } from "../services/mails";
import { CustomError } from "../types/customError";
import { Config, MailsControllersCustomResponse, Usuario } from "../types/types";
import { getDao } from "../dao";

export const newRegister = async (req: Request, res: Response) => {    
    try {                                                                                                                          
        if (!CURRENT_API_BASE_URL || !JWT3_SECRET) throw new Error ("Error interno del servidor, variable de entorno para envio de notificación por nuevo registro de usuario no disponible");     //Envio de mails a la lista de administradores seteada en el archino .env
        const userData = req.body as Partial<Usuario>;                                                                                                                                             // por nuevos registros de usuarios
        
        /* Notificacion por mail a lista de emails seteada en el dashboard */

        const adminEmailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-registro-admin.html");
        const adminEmailHTMLContent = fs.readFileSync(adminEmailHTMLTemplate, "utf8");

        const adminEmailHTMLContentCompleted =
        adminEmailHTMLContent
            .replace("#nombre#", userData.nombre || "")
            .replace("#apellido#", userData.apellido || "")
            .replace("#empresa#", userData.empresa || "")
            .replace("#pais#", userData.pais || "")
            .replace("#provincia#", userData.provincia || "")
            .replace("#ciudad#", userData.ciudad || "")
            .replace("#direccion#", userData.direccion || "")
            .replace("#celular#", userData.celular || "")
            .replace("#telefono#", userData.telefono || "")
            .replace("#dondeConociste#", userData.donde_conociste || "")
            .replace("#email#", userData.email || "")
            .replace("#dondeConociste#", userData.donde_conociste || "")
            .replace("#rubro#", userData.rubro || "")
            .replace("#url#", CURRENT_API_BASE_URL + "/api/enableUser?token=" + jwt.sign({email: userData.email}, JWT3_SECRET));
                    
        const response1 = await getDao().getTable({tableName: "config", conditions: [{field: "seccion", value: "registro"}]});
        const newRegisterNotificationData: Config[] | null= response1.data;
        const newRegisterNotificationSubject = newRegisterNotificationData? newRegisterNotificationData[0].asunto : null;    
        const newRegisterNotificationMails = newRegisterNotificationData? newRegisterNotificationData[0].destinatarios.split(";").map((email) => ({email: email.trim()})).filter((email) => email.email) : null;             //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        if (!newRegisterNotificationMails || !newRegisterNotificationMails.length) 
            throw new Error ("Error: No se envió la notificación de nuevo registro de usuario a la lista de admins ya que no se pudo obtener la lista de emails de destinatarios");
        if (newRegisterNotificationData && newRegisterNotificationData[0].activo !== "1") 
            throw new CustomError("No se enviaron las notificaciones de nuevo registro de usuario ya que la función no está activada", 200);
             
        const response2 = await sendMails({emailsArr: newRegisterNotificationMails, message: adminEmailHTMLContentCompleted, subject: newRegisterNotificationSubject});
        if (response2.success) {
            await getDao().inserNotificationLog({recipients: newRegisterNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Nuevo usuario registrado"});
        } else {
            throw new Error(response2.message);
        }
        
        /* Notificacion por mail a usuario registrado */

        const newRegisterNotificationResponse = newRegisterNotificationData? newRegisterNotificationData[0].respuesta : null;  
        
        const userEmailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-registro-user.html");
        const userEmailHTMLContent = fs.readFileSync(userEmailHTMLTemplate, "utf8");
        const userEmailHTMLContentCompleted = 
        userEmailHTMLContent
            .replace("#mensaje#", newRegisterNotificationResponse || "");

        if (!userData.email) throw new Error ("Error: No se envió la notificación de nuevo registro al usuario ya que no se pudo obtener el email del body");    

        const response3 = await sendMails({emailsArr: [{email: userData.email}], message: userEmailHTMLContentCompleted, subject: "Su cuenta en Almacen de Joyas está en proceso de activación"});
        if (response3.success) {
            await getDao().inserNotificationLog({recipients: userData.email, notificationType: "Cuenta en proceso de activación"});	
        } else {
            throw new Error(response3.message);
        }
        
        res.status(200).json(response3 as MailsControllersCustomResponse);
    
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
        res.status(status).json({ success: false, data: null, message: message } as MailsControllersCustomResponse);

        return;
    }
};