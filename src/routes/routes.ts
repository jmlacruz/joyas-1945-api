import express from "express";
import { productDisabled } from "../controllers/adminNotifications";
import { allowAccessToWeb } from "../controllers/allowAccessToWeb";
import { checkAPI } from "../controllers/checkAPI";
import { newContact } from "../controllers/contact";
import { checkCart } from "../controllers/cron";
import { createUser, deleteRowByID, deleteRows, enableUser, getCartData, getProductByID, getProductsByIDs, getProductsFiltered, getProductsFilteredRowsQuantity, getTable, insertRow, saveCartData, updateProductsOrder, updateTable, usersLogs } from "../controllers/database";
import { deleteDocument, deleteFiles, handleDocument, handleFiles } from "../controllers/firebase";
import { updateGoogleReviews } from "../controllers/googleReviews";
import { isLogged, login, logOut } from "../controllers/log";
import { sendMailToUsersController } from "../controllers/mails";
import { newOrder } from "../controllers/orders";
import { recoveryPassword } from "../controllers/recoveryPassword";
import { newRegister } from "../controllers/register";
import { enabledUser, sendCartReminderMail } from "../controllers/usersNotifications";
import { allowAdmin } from "../midlewares/allowAdmin";
import { uploadDocument, uploadFiles } from "../midlewares/multer";
import { verifyToken } from "../midlewares/verifyToken";
import { verifyTokenForEmailLinkAction } from "../midlewares/verifyTokenForEmailLinkAction";
import { verifyTokenOrTableName } from "../midlewares/verifyTokenOrTableName";

const routes = express.Router();

routes.post("/login", login);
routes.post("/logOut", logOut);
routes.post("/isLogged", verifyToken, isLogged);

routes.get("/db/getProductByID", verifyToken, getProductByID);
routes.get("/db/getProductsByIDs", getProductsByIDs);
routes.get("/db/getProductsFiltered", verifyToken, getProductsFiltered);
routes.get("/db/getProductsFilteredRowsQuantity", verifyToken, getProductsFilteredRowsQuantity);

routes.post("/db/createUser", createUser);

routes.get("/db/getTable", verifyTokenOrTableName, getTable);
routes.put("/db/updateTable", verifyToken, updateTable);
routes.post("/db/insertRow", verifyToken, insertRow);
routes.delete("/db/deleteRowByID", verifyToken, deleteRowByID);
routes.delete("/db/deleteRows", verifyToken, deleteRows);
routes.put("/db/updateProductsOrder", allowAdmin, verifyToken, updateProductsOrder);

routes.post("/uploadFiles", verifyToken, uploadFiles, handleFiles);
routes.get("/deleteFiles", verifyToken, deleteFiles);

routes.post("/uploadDocument", allowAdmin, verifyToken, uploadDocument, handleDocument);
routes.get("/deleteDocument", allowAdmin, verifyToken, deleteDocument);

routes.post("/db/saveCart", verifyToken, saveCartData);
routes.get("/db/getCart", verifyToken, getCartData);

routes.post("/sendMailtoUsers", allowAdmin, verifyToken, sendMailToUsersController);

routes.post("/newRegister", newRegister);                                                           /*Envio de emails a la lista configurada en tabla "config" cuando se registra un nuevo usuario*/
routes.post("/recoveryPassword", recoveryPassword);
routes.post("/newOrder", verifyToken, newOrder);                                                    /*Envío de mail al usuario cuando realiza una compra con los detalle de la misma*/        
routes.post("/newContact", verifyToken, newContact);                                                /*Envio de mail a la lista de mails configurada en la tabla "config -> fila de contactos -> destinatarios" cuando se envia el formulario de contacto*/
routes.post("/productDisabled", allowAdmin, productDisabled);                                       /*Envio de mail a la lista de mails configurada en la tabla "config -> fila de contactos -> destinatarios" cuando se deshabilita un producto*/

routes.get("/enableUser", verifyTokenForEmailLinkAction, enableUser);                               /*Habilita al usuario desde el link que se envia al admin por mail, cuando hay un nuevo registro*/

routes.get("/usersNotifications/sendCartReminderMail", sendCartReminderMail);                       /*Envio de notificacion el usuario por carrito abandonado*/
routes.get("/usersNotifications/enabledUser", allowAdmin, verifyToken, enabledUser);                /*Endpoint para enviar notificación al usuario habilitado desde el dashboard*/

routes.get("/allowAccessToWeb", verifyTokenForEmailLinkAction, allowAccessToWeb);  

routes.get("/checkCart", verifyToken, checkCart);

routes.post("/db/usersLogs", verifyToken, usersLogs);
routes.post("/db/loginError", usersLogs);

routes.get("/getReviews", allowAdmin, updateGoogleReviews);

routes.get("/check", checkAPI) ;

export default routes;