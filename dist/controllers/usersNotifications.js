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
exports.sendCartReminderMail = exports.enabledUser = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const customError_1 = require("../types/customError");
const mails_1 = require("../services/mails");
const environment_1 = require("../environment");
const dao_1 = require("../dao");
const enabledUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.CURRENT_API_BASE_URL || !environment_1.JWT3_SECRET)
            throw new Error("Error interno del servidor, no se pudo obtener variable de entorno para envio de email a usuario por cuenta habilitada");
        const { email, name, lastName } = req.query;
        if (!email || !name)
            throw new customError_1.CustomError("Parametros inválidos en la query de notificación de usuario habilitado", 400);
        const emailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-usuario-habilitado.html");
        const htmlContent = fs_1.default.readFileSync(emailHTMLTemplate, "utf8");
        const htmlContentCompleted = htmlContent
            .replace("#nombre#", name)
            .replace("#apellido#", lastName || "")
            .replace("#url#", environment_1.CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jsonwebtoken_1.default.sign({ email }, environment_1.JWT3_SECRET)}`);
        const response = yield (0, mails_1.sendMails)({ emailsArr: [{ email }], message: htmlContentCompleted });
        if (response.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: email, notificationType: "Cuenta habilitada" });
            res.status(200).json(response);
        }
        else {
            throw new Error(response.message);
        }
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
exports.enabledUser = enabledUser;
const sendCartReminderMail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const token = req.query.token; // luego envia un correo de recordatorio al mail contenido en el token
    if (!environment_1.JWT2_SECRET || !environment_1.JWT3_SECRET || !environment_1.CURRENT_FRONT_BASE_URL)
        throw new customError_1.CustomError("Error interno del servidor, variable de entorno para envio de recordatorio de carrito abandonado no disponible", 500);
    if (!token) {
        throw new customError_1.CustomError("Acceso denegado, no se envió el token", 401);
    }
    else {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.JWT2_SECRET);
            const { userEmail } = decoded;
            if (!userEmail)
                throw new customError_1.CustomError("Token inválido", 401);
            const emailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-pedido-pendiente.html");
            const htmlContent = fs_1.default.readFileSync(emailHTMLTemplate, "utf8");
            const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", conditions: [{ field: "email", value: userEmail }], fields: ["nombre", "apellido"] });
            if (!response1.success)
                throw new Error(`No se pudieron obtener los datos de usuario de la base de datos para envíar el recordatorio de carrito abandonado por mail: ${response1.message}`);
            const userName = response1.data[0].nombre;
            const userLastName = response1.data[0].apellido;
            const htmlContentCompleted = htmlContent
                .replace("#nombre#", userName)
                .replace("#apellido#", userLastName)
                .replace("#url1#", environment_1.CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jsonwebtoken_1.default.sign({ email: userEmail }, environment_1.JWT3_SECRET)}`)
                .replace("#url2#", environment_1.CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jsonwebtoken_1.default.sign({ email: userEmail }, environment_1.JWT3_SECRET)}&pathName=cart`)
                .replace("#url4#", environment_1.CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jsonwebtoken_1.default.sign({ email: userEmail }, environment_1.JWT3_SECRET)}&pathName=cart`);
            const response2 = yield (0, mails_1.sendMails)({ emailsArr: [{ email: userEmail }], message: htmlContentCompleted });
            if (response2.success) {
                console.info(`Usuario ${userEmail} notificado por e-mail por carrito abandonado hace ${environment_1.CART_REMINDER_WAIT_IN_HOURS}hs`);
                yield (0, dao_1.getDao)().inserNotificationLog({ recipients: userEmail, notificationType: "Carrido abandonado" });
            }
            else {
                throw new Error(response2.message);
            }
            res.status(200).end();
        }
        catch (err) {
            const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
            console.error(message);
            const status = err instanceof customError_1.CustomError ? err.status : 500;
            res.status(status).json({ success: false, data: null, message: message });
        }
    }
});
exports.sendCartReminderMail = sendCartReminderMail;
//# sourceMappingURL=usersNotifications.js.map