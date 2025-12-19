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
exports.recoveryPassword = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mails_1 = require("../services/mails");
const customError_1 = require("../types/customError");
const dao_1 = require("../dao");
const recoveryPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.query.email;
        if (!email)
            throw new customError_1.CustomError("Error: No se envió el email", 400);
        const userFields = ["nombre", "apellido", "email", "password"];
        const reponse1 = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", conditions: [{ field: "email", value: email }], fields: userFields });
        if (!reponse1.success || !reponse1.data)
            throw new customError_1.CustomError(`No se pudieron recuperar los datos de usuario de la base de datos: ${reponse1.message}`, 500);
        if (!reponse1.data.length)
            throw new customError_1.CustomError("El email ingresado no está registrado", 404);
        const userData = reponse1.data[0];
        const adminEmailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-usuario-recuperar-password.html");
        const adminEmailHTMLContent = fs_1.default.readFileSync(adminEmailHTMLTemplate, "utf8");
        const adminEmailHTMLContentCompleted = adminEmailHTMLContent
            .replace("#nombre#", userData.nombre || "")
            .replace("#apellido#", userData.apellido || "")
            .replace("#email#", userData.email || "")
            .replace("#password#", userData.password || "");
        const response2 = yield (0, mails_1.sendMails)({ emailsArr: [{ email }], message: adminEmailHTMLContentCompleted, subject: "Recuperación de contraseña de Almacen de Joyas" });
        if (response2.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: email, notificationType: "Recuperación de contraseña (Usuario)" });
        }
        else {
            throw new Error(response2.message);
        }
        res.status(200).json({ success: true, message: "", data: "" });
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
exports.recoveryPassword = recoveryPassword;
//# sourceMappingURL=recoveryPassword.js.map