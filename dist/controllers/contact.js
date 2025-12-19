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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newContact = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const environment_1 = require("../environment");
const mails_1 = require("../services/mails");
const customError_1 = require("../types/customError");
const dao_1 = require("../dao");
const newContact = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.CURRENT_API_BASE_URL || !environment_1.JWT3_SECRET)
            throw new Error("Error interno del servidor, variable de entorno para envio de notificación por nuevo registro de usuario no disponible"); //Envio de mails a la lista de administradores seteada en el archino .env
        const userData = req.body; // por nuevos registros de usuarios
        const adminEmailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-contacto.html");
        const adminEmailHTMLContent = fs_1.default.readFileSync(adminEmailHTMLTemplate, "utf8");
        const adminEmailHTMLContentCompleted = adminEmailHTMLContent
            .replace("#nombre#", userData.name || "")
            .replace("#apellido#", userData.last_name || "")
            .replace("#email#", userData.email || "")
            .replace("#mensaje#", userData.message || "");
        const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "config", conditions: [{ field: "seccion", value: "contactos" }] });
        const newContactNotificationData = response1.data;
        const newContactNotificationSubject = newContactNotificationData ? newContactNotificationData[0].asunto : null;
        const newRegisterNotificationMails = newContactNotificationData ? newContactNotificationData[0].destinatarios.split(";").map((email) => ({ email: email.trim() })).filter((email) => email.email) : null; //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        if (!newRegisterNotificationMails || !newRegisterNotificationMails.length) {
            throw new Error("Error al enviar notificaiones por email por nuevo contacto. No se encontraron destinatarios");
        }
        if (newContactNotificationData && newContactNotificationData[0].activo !== "1")
            throw new customError_1.CustomError("No se enviaron las notificaciones de nuevo contacto ya que la función no está activada", 200);
        const response2 = yield (0, mails_1.sendMails)({ emailsArr: newRegisterNotificationMails, message: adminEmailHTMLContentCompleted, subject: newContactNotificationSubject });
        if (response2.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: newRegisterNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Nuevo contacto" });
        }
        else {
            throw new customError_1.CustomError(response2.message, 500);
        }
        res.status(200).json(response2);
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.newContact = newContact;
//# sourceMappingURL=contact.js.map