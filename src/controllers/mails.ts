import { Response,  Request } from "express";
import { CustomError } from "../types/customError";
import { MailsControllersCustomResponse } from "../types/types";
import { sendMails } from "../services/mails";

export const sendMailToUsersController = async (req: Request, res: Response) => {                            //Envio de mails a clientes por cuentas habilitadas/deshabilitadas
    try {
        const to = req.body.to;
        if (!to || typeof to !== "object") throw new CustomError("Parametros inválidos", 400);
        const toRawList = to as string[];                                                                   //Lista de destinatarios en formato ["email1@gmail", "email2@gmail"]
        const toList = toRawList.map((email: string) => ({email: email}));                                  //Lista de destinatarios para BREVO en formato [{email: "email1@gmail"}, {email:"email2@gmail"}]
        const message = req.body.message as string;
        
        const response = await sendMails({emailsArr: toList, message: message});
        if (response.success) {
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
