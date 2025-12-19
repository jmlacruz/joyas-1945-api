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
exports.newRegister = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../environment");
const mails_1 = require("../services/mails");
const customError_1 = require("../types/customError");
const dao_1 = require("../dao");
const newRegister = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.CURRENT_API_BASE_URL || !environment_1.JWT3_SECRET)
            throw new Error("Error interno del servidor, variable de entorno para envio de notificación por nuevo registro de usuario no disponible"); //Envio de mails a la lista de administradores seteada en el archino .env
        const userData = req.body; // por nuevos registros de usuarios
        /* Notificacion por mail a lista de emails seteada en el dashboard */
        const adminEmailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-registro-admin.html");
        const adminEmailHTMLContent = fs_1.default.readFileSync(adminEmailHTMLTemplate, "utf8");
        const adminEmailHTMLContentCompleted = adminEmailHTMLContent
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
            .replace("#url#", environment_1.CURRENT_API_BASE_URL + "/api/enableUser?token=" + jsonwebtoken_1.default.sign({ email: userData.email }, environment_1.JWT3_SECRET));
        const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "config", conditions: [{ field: "seccion", value: "registro" }] });
        const newRegisterNotificationData = response1.data;
        const newRegisterNotificationSubject = newRegisterNotificationData ? newRegisterNotificationData[0].asunto : null;
        const newRegisterNotificationMails = newRegisterNotificationData ? newRegisterNotificationData[0].destinatarios.split(";").map((email) => ({ email: email.trim() })).filter((email) => email.email) : null; //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        if (!newRegisterNotificationMails || !newRegisterNotificationMails.length)
            throw new Error("Error: No se envió la notificación de nuevo registro de usuario a la lista de admins ya que no se pudo obtener la lista de emails de destinatarios");
        if (newRegisterNotificationData && newRegisterNotificationData[0].activo !== "1")
            throw new customError_1.CustomError("No se enviaron las notificaciones de nuevo registro de usuario ya que la función no está activada", 200);
        const response2 = yield (0, mails_1.sendMails)({ emailsArr: newRegisterNotificationMails, message: adminEmailHTMLContentCompleted, subject: newRegisterNotificationSubject });
        if (response2.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: newRegisterNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Nuevo usuario registrado" });
        }
        else {
            throw new Error(response2.message);
        }
        /* Notificacion por mail a usuario registrado */
        const newRegisterNotificationResponse = newRegisterNotificationData ? newRegisterNotificationData[0].respuesta : null;
        const userEmailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-registro-user.html");
        const userEmailHTMLContent = fs_1.default.readFileSync(userEmailHTMLTemplate, "utf8");
        const userEmailHTMLContentCompleted = userEmailHTMLContent
            .replace("#mensaje#", newRegisterNotificationResponse || "");
        if (!userData.email)
            throw new Error("Error: No se envió la notificación de nuevo registro al usuario ya que no se pudo obtener el email del body");
        const response3 = yield (0, mails_1.sendMails)({ emailsArr: [{ email: userData.email }], message: userEmailHTMLContentCompleted, subject: "Su cuenta en Almacen de Joyas está en proceso de activación" });
        if (response3.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: userData.email, notificationType: "Cuenta en proceso de activación" });
        }
        else {
            throw new Error(response3.message);
        }
        res.status(200).json(response3);
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
        return;
    }
});
exports.newRegister = newRegister;
//# sourceMappingURL=register.js.map