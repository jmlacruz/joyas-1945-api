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
exports.sendMailToUsersController = void 0;
const customError_1 = require("../types/customError");
const mails_1 = require("../services/mails");
const sendMailToUsersController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const to = req.body.to;
        if (!to || typeof to !== "object")
            throw new customError_1.CustomError("Parametros inválidos", 400);
        const toRawList = to; //Lista de destinatarios en formato ["email1@gmail", "email2@gmail"]
        const toList = toRawList.map((email) => ({ email: email })); //Lista de destinatarios para BREVO en formato [{email: "email1@gmail"}, {email:"email2@gmail"}]
        const message = req.body.message;
        const response = yield (0, mails_1.sendMails)({ emailsArr: toList, message: message });
        if (response.success) {
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
exports.sendMailToUsersController = sendMailToUsersController;
//# sourceMappingURL=mails.js.map