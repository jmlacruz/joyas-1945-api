import { BREVO_API_KEY, NODE_ENV } from "../environment";
import { MailsControllersCustomResponse } from "../types/types";

export const sendMails = async (data: { emailsArr: { email: string }[], message: string, subject?: string | null }) => {
    try {
        if (NODE_ENV) {                                                                                     /* Solo se envian mails en produccion*/
            if (!BREVO_API_KEY) throw new Error("No se pudo enviar el correo, variables de entorno no encontradas.");
            const responseJSON = await fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": BREVO_API_KEY,
                },
                body: JSON.stringify({
                    sender: { name: "Joyas 1945", email: "joyas1945@gmail.com" },
                    to: data.emailsArr,                                                                     /* Array de mails en formato [{ email: "email1" }, {email: "email2"}]*/
                    subject: data.subject || "Nueva notificación de Joyas 1945",
                    htmlContent: data.message
                })
            });
            const responseOBJ = await responseJSON.json();
            if (responseOBJ.messageId) {
                console.info(`Correo/s enviado/s con exito a ${JSON.stringify(data.emailsArr)}: (ID de envío: ${responseOBJ.messageId})`);
                return ({ success: true, data: responseOBJ.messageId, message: `Emails enviados correctamente: ID  de envío ${responseOBJ.messageId}` } as MailsControllersCustomResponse);
            } else {
                console.error(`Falló el envío de Correo/s a ${JSON.stringify(data.emailsArr)}: ${JSON.stringify(responseOBJ)}`);
                return ({ success: false, data: null, message: JSON.stringify(responseOBJ) } as MailsControllersCustomResponse);
            }
        } else {
            const message = `No se envió en correo electrónico (Entorno actual: ${NODE_ENV ? "Producción" : "Desarrollo"})`;
            console.info(message);
            return ({ success: true, data: null, message: message } as MailsControllersCustomResponse);
        }
    } catch (err) {
        return ({ success: false, data: null, message: err instanceof Error ? "Error:" + err.message : "Error desconocido" } as MailsControllersCustomResponse);
    }
};
