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
exports.productDisabled = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const environment_1 = require("../environment");
const mails_1 = require("../services/mails");
const customError_1 = require("../types/customError");
const dao_1 = require("../dao");
const productDisabled = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!environment_1.CURRENT_API_BASE_URL)
            throw new Error("Error interno del servidor. Variable de entorno para envío de notificación por producto deshabilitado no disponible - (productDisabled)");
        const { productID } = req.query;
        const productIDparsed = parseInt(productID);
        if (!productIDparsed)
            throw new Error("Error: El ID del producto deshabilitado tiene tipo incorrecto");
        const response = yield (0, dao_1.getDao)().getTable({ tableName: "producto", conditions: [{ field: "id", value: productIDparsed }] });
        if (!response.success || !response.data || !response.data.length)
            throw new Error("Error: No se pudo obtener el producto deshabilitado de la base de datos");
        const productData = response.data[0];
        const brandFields = ["id", "descripcion"];
        const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "marca", fields: brandFields });
        if (!response1.success || !response1.data || !response1.data.length)
            throw new Error("Error: No se pudieron obtener los datos de marcas de la base de datos, para la notificación de producto deshabilitado");
        const brandsData = response1.data;
        const categoryFields = ["id", "nombre"];
        const response2 = yield (0, dao_1.getDao)().getTable({ tableName: "categoria", fields: categoryFields });
        if (!response2.success || !response2.data || !response2.data.length)
            throw new Error("Error: No se pudieron obtener los datos de categorías de la base de datos, para la notificación de producto deshabilitado");
        const categoriesData = response2.data;
        const brandName = (_a = brandsData.find((brand) => brand.id === productData.marca)) === null || _a === void 0 ? void 0 : _a.descripcion;
        const categoryName = (_b = categoriesData.find((category) => category.id === productData.categoria)) === null || _b === void 0 ? void 0 : _b.nombre;
        const foto1Name = productData.foto1;
        const foto1ThumbnailUrl = `${environment_1.THUMBNAILS_ROUTE || ""}/${foto1Name}`;
        /* Notificacion por mail a lista de emails seteada en el dashboard */
        const adminEmailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-producto-deshabilitado.html");
        const adminEmailHTMLContent = fs_1.default.readFileSync(adminEmailHTMLTemplate, "utf8");
        const adminEmailHTMLContentCompleted = adminEmailHTMLContent
            .replace("#codigo#", productData.codigo || "")
            .replace("#nombre#", productData.nombre || "")
            .replace("#categoria#", categoryName || "")
            .replace("#marca#", brandName || "")
            .replace("#precio#", productData.precio.toString() || "")
            .replace("#fotoUrl#", foto1ThumbnailUrl || "");
        const response3 = yield (0, dao_1.getDao)().getTable({ tableName: "config", conditions: [{ field: "seccion", value: "producto_deshabilitado" }] });
        const productDisabledNotificationData = response3.data;
        const productDisabledNotificationSubject = productDisabledNotificationData ? productDisabledNotificationData[0].asunto : null;
        const productDisabledNotificationMails = productDisabledNotificationData ? productDisabledNotificationData[0].destinatarios.split(";").map((email) => ({ email: email.trim() })).filter((email) => email.email) : null; //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        if (!productDisabledNotificationMails || !productDisabledNotificationMails.length)
            throw new Error("Error: No se envió la notificación por producto deshabilitado ya que no se pudieron obtener el/los email/s de la lista de destinatarios");
        if (productDisabledNotificationData && productDisabledNotificationData[0].activo !== "1")
            throw new customError_1.CustomError("No se enviaron las notificaciones por producto deshabilitado ya que la función no está activada", 200);
        const response4 = yield (0, mails_1.sendMails)({ emailsArr: productDisabledNotificationMails, message: adminEmailHTMLContentCompleted, subject: productDisabledNotificationSubject });
        if (response4.success) {
            yield (0, dao_1.getDao)().inserNotificationLog({ recipients: productDisabledNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Producto deshabilitado" });
        }
        else {
            throw new Error("Error: No se pudieron enviar las notificaciones por producto deshabilitado: " + response4.message);
        }
        res.status(200).json(response4);
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
exports.productDisabled = productDisabled;
//# sourceMappingURL=adminNotifications.js.map