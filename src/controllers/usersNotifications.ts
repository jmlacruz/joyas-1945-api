import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { Response,  Request } from "express";
import { CustomError } from "../types/customError";
import { sendMails } from "../services/mails";
import { MailsControllersCustomResponse } from "../types/types";
import { CART_REMINDER_WAIT_IN_HOURS, CURRENT_API_BASE_URL, CURRENT_FRONT_BASE_URL, JWT2_SECRET, JWT3_SECRET } from "../environment";
import { getDao } from "../dao";

export const enabledUser = async (req: Request, res: Response) => {                            //Envio de mails a clientes por cuentas habilitadas/deshabilitadas
    try {
        if (!CURRENT_API_BASE_URL || !JWT3_SECRET) throw new Error("Error interno del servidor, no se pudo obtener variable de entorno para envio de email a usuario por cuenta habilitada");
        
        const {email, name, lastName} = req.query as {email: string, name: string, lastName: string};
        if (!email || !name) throw new CustomError("Parametros inválidos en la query de notificación de usuario habilitado", 400);
        
        const emailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-usuario-habilitado.html");
        const htmlContent = fs.readFileSync(emailHTMLTemplate, "utf8");

        const htmlContentCompleted =
        htmlContent
            .replace("#nombre#", name)
            .replace("#apellido#", lastName || "")
            .replace("#url#", CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jwt.sign({email}, JWT3_SECRET)}`);
        
        const response = await sendMails({emailsArr: [{email}], message: htmlContentCompleted});
        if (response.success) {
            await getDao().inserNotificationLog({recipients: email, notificationType: "Cuenta habilitada"});	
            res.status(200).json(response as MailsControllersCustomResponse);
        } else {
            throw new Error(response.message);
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
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as MailsControllersCustomResponse);
    }
};

export const sendCartReminderMail = async (req: Request, res: Response) => {                                                    //Controlador que recibe la peticion http desde cron-job.org en el tiempo programado
    const token = req.query.token as string;                                                                                    // luego envia un correo de recordatorio al mail contenido en el token

    if (!JWT2_SECRET || !JWT3_SECRET || !CURRENT_FRONT_BASE_URL) throw new CustomError("Error interno del servidor, variable de entorno para envio de recordatorio de carrito abandonado no disponible", 500);
    if (!token) {
        throw new CustomError("Acceso denegado, no se envió el token", 401);
    } else {
        try {
            const decoded = jwt.verify(token, JWT2_SECRET) as { userEmail: string };
            const { userEmail } = decoded;
            if (!userEmail) throw new CustomError("Token inválido", 401);

            const emailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-pedido-pendiente.html");
            const htmlContent = fs.readFileSync(emailHTMLTemplate, "utf8");

            const response1 = await getDao().getTable({ tableName: "usuario", conditions: [{ field: "email", value: userEmail }], fields: ["nombre", "apellido"] });
            if (!response1.success) throw new Error(`No se pudieron obtener los datos de usuario de la base de datos para envíar el recordatorio de carrito abandonado por mail: ${response1.message}`);

            const userName = response1.data[0].nombre;
            const userLastName = response1.data[0].apellido;

            const htmlContentCompleted =
                htmlContent
                    .replace("#nombre#", userName)
                    .replace("#apellido#", userLastName)
                    .replace("#url1#", CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jwt.sign({email: userEmail}, JWT3_SECRET)}`)
                    .replace("#url2#", CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jwt.sign({email: userEmail}, JWT3_SECRET)}&pathName=cart`)
                    .replace("#url4#", CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jwt.sign({email: userEmail}, JWT3_SECRET)}&pathName=cart`);

            const response2 = await sendMails({ emailsArr: [{ email: userEmail }], message: htmlContentCompleted });
            if (response2.success) {
                console.info(`Usuario ${userEmail} notificado por e-mail por carrito abandonado hace ${CART_REMINDER_WAIT_IN_HOURS}hs`);
                await getDao().inserNotificationLog({recipients: userEmail, notificationType: "Carrido abandonado"});	
            } else {
                throw new Error(response2.message);
            }
            res.status(200).end();
        } catch (err) {
            const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
            console.error(message);
            const status = err instanceof CustomError ? err.status : 500;
            res.status(status).json({ success: false, data: null, message: message } as MailsControllersCustomResponse);
        }
    }
}; 