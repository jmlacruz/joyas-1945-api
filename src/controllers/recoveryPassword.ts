import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { sendMails } from "../services/mails";
import { CustomError } from "../types/customError";
import { MailsControllersCustomResponse, Usuario} from "../types/types";
import { getDao } from "../dao";

export const recoveryPassword = async (req: Request, res: Response) => {    
    try {                                                                                                                          
        const email = req.query.email as string | undefined;       
        if (!email) throw new CustomError("Error: No se envió el email", 400);   
        
        const userFields: (keyof Usuario)[] = ["nombre", "apellido", "email", "password"];
        const reponse1 = await getDao().getTable({tableName: "usuario", conditions: [{field: "email", value: email}], fields: userFields});
        if (!reponse1.success || !reponse1.data) throw new CustomError(`No se pudieron recuperar los datos de usuario de la base de datos: ${reponse1.message}`, 500);
        if (!reponse1.data.length) throw new CustomError("El email ingresado no está registrado", 404);
        const userData: Usuario = reponse1.data[0];
             
        const adminEmailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-usuario-recuperar-password.html");
        const adminEmailHTMLContent = fs.readFileSync(adminEmailHTMLTemplate, "utf8");

        const adminEmailHTMLContentCompleted =
        adminEmailHTMLContent
            .replace("#nombre#", userData.nombre || "")
            .replace("#apellido#", userData.apellido || "")
            .replace("#email#", userData.email || "")
            .replace("#password#", userData.password || "");
                                                      
        const response2 = await sendMails({emailsArr: [{email}], message: adminEmailHTMLContentCompleted, subject: "Recuperación de contraseña de Almacen de Joyas"});
        if (response2.success) {
            await getDao().inserNotificationLog({recipients: email, notificationType: "Recuperación de contraseña (Usuario)"});
        } else {
            throw new Error(response2.message);
        }
                
        res.status(200).json({success: true, message: "", data: ""} as MailsControllersCustomResponse);
    
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