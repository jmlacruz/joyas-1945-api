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
exports.newOrder = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const orderTemplate_1 = require("../data/orderTemplate");
const mails_1 = require("../services/mails");
const customError_1 = require("../types/customError");
const database_1 = require("../utils/database");
const dao_1 = require("../dao");
const utils_1 = require("../utils/utils");
const newOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { orderHTML, orderCSS, orderData } = req.body;
        const { email: userEmail } = req.decoded;
        if (!userEmail)
            throw new customError_1.CustomError("No se pudo procesar la orden. Datos de token faltantes (email)", 400);
        const orderAddedResponse = yield (0, database_1.generateOrder)({ userEmail, orderData });
        if (!orderAddedResponse.success)
            throw new customError_1.CustomError(`Ocurrió un error al procesaer la orden: ${orderAddedResponse.message}`, 500);
        const orderAddedID = orderAddedResponse.data[0];
        const response = yield (0, mails_1.sendMails)({ emailsArr: [{ email: userEmail }], message: (0, orderTemplate_1.getOrdertemplate)({ orderHTML, orderCSS }) }); //Envio de mail con los detalles de la nueva orden al usuario
        if (response.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: userEmail, notificationType: "Nuevo pedido (Detalle para usuario)" });
        }
        else {
            console.error(response.message);
        }
        const userFields = ["nombre", "apellido", "provincia", "telefono", "celular", "rubro"];
        const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", conditions: [{ field: "email", value: userEmail }], fields: userFields });
        if (!response1.success || !response1.data || !response1.data.length)
            throw new customError_1.CustomError(response1.message, 500);
        const userData = response1.data[0];
        const orderFields = ["fecha", "total", "id_metodo_envio", "observaciones"];
        const response2 = yield (0, dao_1.getDao)().getTable({ tableName: "pedidos", conditions: [{ field: "id", value: orderAddedID }], fields: orderFields });
        if (!response2.success || !response2.data || !response2.data.length)
            throw new customError_1.CustomError(response2.message, 500);
        const orderDataFromDB = response2.data[0];
        const detailsFields = ["id_producto", "precio", "observaciones", "cantidad", "total", "precioCalculado"];
        const response3 = yield (0, dao_1.getDao)().getTable({ tableName: "detalle", conditions: [{ field: "id_pedido", value: orderAddedID }], fields: detailsFields });
        if (!response3.success || !response3.data || !response3.data.length)
            throw new customError_1.CustomError(response3.message, 500);
        const detailsDataFromDB = response3.data;
        const productFields = ["nombre", "foto1", "id"];
        const productsIDsArr = detailsDataFromDB.map((detail) => detail.id_producto);
        const response4 = yield (0, dao_1.getDao)().getProductsByIDs({ productsIDsArr, fieldsArr: productFields });
        if (!response4.success || !response4.data || !response4.data.length)
            throw new customError_1.CustomError(response4.message, 500);
        const productsDataFromDB = response4.data;
        const response5 = yield (0, dao_1.getDao)().getTable({ tableName: "metodo_envio" });
        if (!response5.success || !response5.data || !response5.data.length)
            throw new customError_1.CustomError(response5.message, 500);
        const shippingMethodsDataFromDB = response5.data;
        const productsDataForTable = productsDataFromDB.map((product) => {
            const detail = detailsDataFromDB.find((detail) => detail.id_producto === product.id);
            return Object.assign(Object.assign({}, product), { cantidad: detail === null || detail === void 0 ? void 0 : detail.cantidad, observaciones: detail === null || detail === void 0 ? void 0 : detail.observaciones, total: detail === null || detail === void 0 ? void 0 : detail.total, precio: detail ? detail.precio * detail.precioCalculado : "" });
        });
        const productsDataForTableHTML = productsDataForTable.map((productData) => `<tr>
                <td>${productData.nombre}</td>
                <td><img src=${(0, utils_1.getImageUrls)(productData.foto1).thumbnailUrl} width=50 height=50 /></td>
                <td>${productData.observaciones}</td>
                <td>$${typeof productData.precio === "number" ? productData.precio.toFixed(2) : ""}</td>
                <td>${productData.cantidad}</td>
                <td>$${productData.total}</td>
            </tr>`).join("");
        const adminEmailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-nuevo-pedido-admin.html");
        const adminEmailHTMLContent = fs_1.default.readFileSync(adminEmailHTMLTemplate, "utf8");
        const adminEmailHTMLContentCompleted = adminEmailHTMLContent
            .replace("#nombre#", userData.nombre || "")
            .replace("#apellido#", userData.apellido || "")
            .replace("#email#", userEmail || "")
            .replace("#rubro#", userData.rubro || "")
            .replace("#provincia#", userData.provincia || "")
            .replace("#telefono#", userData.telefono || "")
            .replace("#celular#", userData.celular || "")
            .replace("#fecha#", (0, utils_1.getCurrentDateTime)() || "")
            .replace("#total#", orderDataFromDB.total.toString() || "")
            .replace("#metodo_envio#", ((_a = shippingMethodsDataFromDB.find((methodData) => methodData.id === orderDataFromDB.id_metodo_envio)) === null || _a === void 0 ? void 0 : _a.nombre) || "")
            .replace("#observaciones#", orderDataFromDB.observaciones || "")
            .replace("#tableData#", productsDataForTableHTML || "");
        const response6 = yield (0, dao_1.getDao)().getTable({ tableName: "config", conditions: [{ field: "seccion", value: "pedidos" }] });
        const newOrderNotificationData = response6.data;
        const newOrderNotificationSubject = newOrderNotificationData ? newOrderNotificationData[0].asunto : null;
        const newOrderNotificationMails = newOrderNotificationData ? newOrderNotificationData[0].destinatarios.split(";").map((email) => ({ email: email.trim() })).filter((email) => email.email) : null; //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        if (!newOrderNotificationMails || !newOrderNotificationMails.length)
            throw new Error("Error: No se envió la notificación de nuevo registro de usuario a la lista de admins ya que no se pudo obtener la lista de emails de destinatarios");
        if (newOrderNotificationData && newOrderNotificationData[0].activo !== "1")
            throw new customError_1.CustomError("No se enviaron las notificaciones de nuevo registro de usuario ya que la función no está activada", 200);
        const response7 = yield (0, mails_1.sendMails)({ emailsArr: newOrderNotificationMails, message: adminEmailHTMLContentCompleted, subject: newOrderNotificationSubject }); //Envio de mails con los detalles de la nueva orden a la lista de admins seteada en tabla "config -> pedidos -> destinatarios"
        if (response7.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: newOrderNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Nuevo pedido (Detalle para admins)" });
        }
        else {
            console.error(response7.message);
        }
        if (response.success && response7.success) {
            res.status(200).json({ success: true, message: "", data: null });
        }
        else { //Falló algun envio de email
            res.status(200).json({ success: true, message: "Orden procesada correctamente. Ocurrió un error al enviar las notificaciones con el detalle de la orden", data: null });
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
exports.newOrder = newOrder;
//# sourceMappingURL=orders.js.map