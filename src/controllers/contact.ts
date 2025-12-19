import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { CURRENT_API_BASE_URL, JWT3_SECRET } from "../environment";
import { sendMails } from "../services/mails";
import { CustomError } from "../types/customError";
import { Config, MailsControllersCustomResponse } from "../types/types";
import { getDao } from "../dao";
import { ContactFormValues } from "../types/misc";

export const newContact = async (req: Request, res: Response) => {                                                          // Notificacion por mail a lista de emails seteada en el dashboard 
    try {                                                                                                                          
        if (!CURRENT_API_BASE_URL || !JWT3_SECRET) throw new Error ("Error interno del servidor, variable de entorno para envio de notificación por nuevo registro de usuario no disponible");               //Envio de mails a la lista de administradores seteada en el archino .env
        const userData = req.body as ContactFormValues;                                                                      // por nuevos registros de usuarios
                
        const adminEmailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-contacto.html");
        const adminEmailHTMLContent = fs.readFileSync(adminEmailHTMLTemplate, "utf8");

        const adminEmailHTMLContentCompleted =
        adminEmailHTMLContent
            .replace("#nombre#", userData.name || "")
            .replace("#apellido#", userData.last_name || "")
            .replace("#email#", userData.email || "")
            .replace("#mensaje#", userData.message || "");
                       
        const response1 = await getDao().getTable({tableName: "config", conditions: [{field: "seccion", value: "contactos"}]});
        const newContactNotificationData: Config[] | null = response1.data;

        const newContactNotificationSubject = newContactNotificationData? newContactNotificationData[0].asunto : null;    
        const newRegisterNotificationMails = newContactNotificationData? newContactNotificationData[0].destinatarios.split(";").map((email) => ({email: email.trim()})).filter((email) => email.email) : null;             //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        
        if (!newRegisterNotificationMails || !newRegisterNotificationMails.length) {
            throw new Error ("Error al enviar notificaiones por email por nuevo contacto. No se encontraron destinatarios");
        }

        if (newContactNotificationData && newContactNotificationData[0].activo !== "1") 
            throw new CustomError("No se enviaron las notificaciones de nuevo contacto ya que la función no está activada", 200);
        
        const response2 = await sendMails({emailsArr: newRegisterNotificationMails, message: adminEmailHTMLContentCompleted, subject: newContactNotificationSubject});
        if (response2.success) {
            await getDao().inserNotificationLog({recipients: newRegisterNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Nuevo contacto"});
        } else {
            throw new CustomError(response2.message, 500);
        }
         
        res.status(200).json(response2 as MailsControllersCustomResponse);

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
    }
};