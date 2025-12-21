"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMails = void 0;
const environment_1 = require("../environment");
const sendMails = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (environment_1.NODE_ENV) { /* Solo se envian mails en produccion*/
            if (!environment_1.BREVO_API_KEY)
                throw new Error("No se pudo enviar el correo, variables de entorno no encontradas.");
            const responseJSON = yield fetch("https://api.brevo.com/v3/smtp/email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": environment_1.BREVO_API_KEY,
                },
                body: JSON.stringify({
                    sender: { name: "Joyas 1945", email: "joyas1945@gmail.com" },
                    to: data.emailsArr, /* Array de mails en formato [{ email: "email1" }, {email: "email2"}]*/
                    subject: data.subject || "Nueva notificación de Joyas 1945",
                    htmlContent: data.message
                })
            });
            const responseOBJ = yield responseJSON.json();
            if (responseOBJ.messageId) {
                console.info(`Correo/s enviado/s con exito a ${JSON.stringify(data.emailsArr)}: (ID de envío: ${responseOBJ.messageId})`);
                return { success: true, data: responseOBJ.messageId, message: `Emails enviados correctamente: ID  de envío ${responseOBJ.messageId}` };
            }
            else {
                console.error(`Falló el envío de Correo/s a ${JSON.stringify(data.emailsArr)}: ${JSON.stringify(responseOBJ)}`);
                return { success: false, data: null, message: JSON.stringify(responseOBJ) };
            }
        }
        else {
            const message = `No se envió en correo electrónico (Entorno actual: ${environment_1.NODE_ENV ? "Producción" : "Desarrollo"})`;
            console.info(message);
            return { success: true, data: null, message: message };
        }
    }
    catch (err) {
        return { success: false, data: null, message: err instanceof Error ? "Error:" + err.message : "Error desconocido" };
    }
});
exports.sendMails = sendMails;
//# sourceMappingURL=mails.js.map