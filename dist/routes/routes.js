"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminNotifications_1 = require("../controllers/adminNotifications");
const allowAccessToWeb_1 = require("../controllers/allowAccessToWeb");
const checkAPI_1 = require("../controllers/checkAPI");
const contact_1 = require("../controllers/contact");
const cron_1 = require("../controllers/cron");
const database_1 = require("../controllers/database");
const firebase_1 = require("../controllers/firebase");
const googleReviews_1 = require("../controllers/googleReviews");
const log_1 = require("../controllers/log");
const mails_1 = require("../controllers/mails");
const orders_1 = require("../controllers/orders");
const recoveryPassword_1 = require("../controllers/recoveryPassword");
const register_1 = require("../controllers/register");
const usersNotifications_1 = require("../controllers/usersNotifications");
const allowAdmin_1 = require("../midlewares/allowAdmin");
const multer_1 = require("../midlewares/multer");
const verifyToken_1 = require("../midlewares/verifyToken");
const verifyTokenForEmailLinkAction_1 = require("../midlewares/verifyTokenForEmailLinkAction");
const verifyTokenOrTableName_1 = require("../midlewares/verifyTokenOrTableName");
const routes = express_1.default.Router();
routes.post("/login", log_1.login);
routes.post("/logOut", log_1.logOut);
routes.post("/isLogged", verifyToken_1.verifyToken, log_1.isLogged);
routes.get("/db/getProductByID", verifyToken_1.verifyToken, database_1.getProductByID);
routes.get("/db/getProductsByIDs", database_1.getProductsByIDs);
routes.get("/db/getProductsFiltered", verifyToken_1.verifyToken, database_1.getProductsFiltered);
routes.get("/db/getProductsFilteredRowsQuantity", verifyToken_1.verifyToken, database_1.getProductsFilteredRowsQuantity);
routes.post("/db/createUser", database_1.createUser);
routes.get("/db/getTable", verifyTokenOrTableName_1.verifyTokenOrTableName, database_1.getTable);
routes.put("/db/updateTable", verifyToken_1.verifyToken, database_1.updateTable);
routes.post("/db/insertRow", verifyToken_1.verifyToken, database_1.insertRow);
routes.delete("/db/deleteRowByID", verifyToken_1.verifyToken, database_1.deleteRowByID);
routes.delete("/db/deleteRows", verifyToken_1.verifyToken, database_1.deleteRows);
routes.put("/db/updateProductsOrder", allowAdmin_1.allowAdmin, verifyToken_1.verifyToken, database_1.updateProductsOrder);
routes.post("/uploadFiles", verifyToken_1.verifyToken, multer_1.uploadFiles, firebase_1.handleFiles);
routes.get("/deleteFiles", verifyToken_1.verifyToken, firebase_1.deleteFiles);
routes.post("/uploadDocument", allowAdmin_1.allowAdmin, verifyToken_1.verifyToken, multer_1.uploadDocument, firebase_1.handleDocument);
routes.get("/deleteDocument", allowAdmin_1.allowAdmin, verifyToken_1.verifyToken, firebase_1.deleteDocument);
routes.post("/db/saveCart", verifyToken_1.verifyToken, database_1.saveCartData);
routes.get("/db/getCart", verifyToken_1.verifyToken, database_1.getCartData);
routes.post("/sendMailtoUsers", allowAdmin_1.allowAdmin, verifyToken_1.verifyToken, mails_1.sendMailToUsersController);
routes.post("/newRegister", register_1.newRegister); /*Envio de emails a la lista configurada en tabla "config" cuando se registra un nuevo usuario*/
routes.post("/recoveryPassword", recoveryPassword_1.recoveryPassword);
routes.post("/newOrder", verifyToken_1.verifyToken, orders_1.newOrder); /*Envío de mail al usuario cuando realiza una compra con los detalle de la misma*/
routes.post("/newContact", verifyToken_1.verifyToken, contact_1.newContact); /*Envio de mail a la lista de mails configurada en la tabla "config -> fila de contactos -> destinatarios" cuando se envia el formulario de contacto*/
routes.post("/productDisabled", allowAdmin_1.allowAdmin, adminNotifications_1.productDisabled); /*Envio de mail a la lista de mails configurada en la tabla "config -> fila de contactos -> destinatarios" cuando se deshabilita un producto*/
routes.get("/enableUser", verifyTokenForEmailLinkAction_1.verifyTokenForEmailLinkAction, database_1.enableUser); /*Habilita al usuario desde el link que se envia al admin por mail, cuando hay un nuevo registro*/
routes.get("/usersNotifications/sendCartReminderMail", usersNotifications_1.sendCartReminderMail); /*Envio de notificacion el usuario por carrito abandonado*/
routes.get("/usersNotifications/enabledUser", allowAdmin_1.allowAdmin, verifyToken_1.verifyToken, usersNotifications_1.enabledUser); /*Endpoint para enviar notificación al usuario habilitado desde el dashboard*/
routes.get("/allowAccessToWeb", verifyTokenForEmailLinkAction_1.verifyTokenForEmailLinkAction, allowAccessToWeb_1.allowAccessToWeb);
routes.get("/checkCart", verifyToken_1.verifyToken, cron_1.checkCart);
routes.post("/db/usersLogs", verifyToken_1.verifyToken, database_1.usersLogs);
routes.post("/db/loginError", database_1.usersLogs);
routes.get("/getReviews", allowAdmin_1.allowAdmin, googleReviews_1.updateGoogleReviews);
routes.get("/check", checkAPI_1.checkAPI);
exports.default = routes;
//# sourceMappingURL=routes.js.map