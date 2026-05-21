import path from "path";
import fs from "fs";
import { Response,  Request } from "express";
import { sendMails } from "../services/mails";
import { CustomError } from "../types/customError";
import { Config, DatabaseControllers_CustomResponse, Detalle, MailsControllersCustomResponse, Metodo_envio, Pedidos, Producto, Usuario } from "../types/types";
import { generateOrder } from "../utils/database";
import { OrderData } from "../types/orders";
import { getDao } from "../dao";
import { getCurrentDateTime, getImageUrls } from "../utils/utils";

export const newOrder = async (req: Request, res: Response) => {                                                                   
    try {                        
        const { orderData }: {orderData: OrderData} = req.body;
        const {email: userEmail} = req.decoded;
        if (!userEmail) throw new CustomError("No se pudo procesar la orden. Datos de token faltantes (email)", 400);

        const orderAddedResponse = await generateOrder({userEmail, orderData});
        if (!orderAddedResponse.success) throw new CustomError(`Ocurrió un error al procesaer la orden: ${orderAddedResponse.message}`, 500);
        const orderAddedID = orderAddedResponse.data[0];

        const userFields: (keyof Usuario)[] = ["nombre", "apellido", "provincia", "telefono", "celular", "rubro"];
        const response1 = await getDao().getTable({tableName: "usuario", conditions: [{field: "email", value: userEmail}], fields: userFields});
        if (!response1.success || !response1.data || !response1.data.length) throw new CustomError(response1.message, 500);
        const userData: Usuario = response1.data[0];

        const orderFields: (keyof Pedidos)[] = ["fecha", "total", "id_metodo_envio", "observaciones"];
        const response2 = await getDao().getTable({tableName: "pedidos", conditions: [{field: "id", value: orderAddedID}], fields: orderFields});
        if (!response2.success || !response2.data || !response2.data.length) throw new CustomError(response2.message, 500);
        const orderDataFromDB: Pedidos = response2.data[0];

        const detailsFields: (keyof Detalle)[] = ["id_producto" , "precio", "observaciones", "cantidad", "total", "precioCalculado"];
        const response3 = await getDao().getTable({tableName: "detalle", conditions: [{field: "id_pedido", value: orderAddedID}], fields: detailsFields});
        if (!response3.success || !response3.data || !response3.data.length) throw new CustomError(response3.message, 500);
        const detailsDataFromDB: Detalle[] = response3.data;

        const productFields: (keyof Producto)[] = ["nombre", "foto1", "id"];
        const productsIDsArr = detailsDataFromDB.map((detail) => detail.id_producto);
        const response4 = await getDao().getProductsByIDs({productsIDsArr, fieldsArr: productFields});
        if (!response4.success || !response4.data || !response4.data.length) throw new CustomError(response4.message, 500);
        const productsDataFromDB: Pick<Producto, "nombre" | "foto1" | "id" | "thumbnail1">[] = response4.data;

        const response5 = await getDao().getTable({tableName: "metodo_envio"});
        if (!response5.success || !response5.data || !response5.data.length) throw new CustomError(response5.message, 500);
        const shippingMethodsDataFromDB: Metodo_envio[] = response5.data;

        const productsDataForTable = productsDataFromDB.map((product) => {
            const detail = detailsDataFromDB.find((detail) => detail.id_producto === product.id);
            return {...product, cantidad: detail?.cantidad, observaciones: detail?.observaciones, total: detail?.total, precio: detail ? detail.precio * detail.precioCalculado : ""};
        });

        const productCardRow = (label: string, value: string) =>
            `<tr>
                <td width="110" valign="top" style="padding: 10px; font-size: 13px; font-weight: bold; color: #555555; background-color: #F3F3F3; border-bottom: 1px solid #EAEAEA; line-height: 18px;">${label}</td>
                <td valign="top" style="padding: 10px; font-size: 14px; color: #333333; border-bottom: 1px solid #EAEAEA; line-height: 18px; word-break: break-word;">${value}</td>
            </tr>`;

        const productsDataForTableHTML = productsDataForTable.map((productData) => {
            const imageUrl = getImageUrls(productData.foto1).thumbnailUrl;
            const precio = typeof productData.precio === "number" ? productData.precio.toFixed(2) : "";
            return `<table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%; margin-bottom: 16px; border: 1px solid #DADADA; border-collapse: collapse;">
                ${productCardRow("Producto", productData.nombre || "")}
                ${productCardRow("Foto", `<img src="${imageUrl}" width="50" height="50" alt="" style="display: block; border: 0; max-width: 50px; height: auto;" />`)}
                ${productCardRow("Observaciones", productData.observaciones || "")}
                ${productCardRow("Precio", `$${precio}`)}
                ${productCardRow("Cantidad", String(productData.cantidad ?? ""))}
                ${productCardRow("Total", `$${productData.total ?? ""}`)}
            </table>`;
        }).join("");               

        const adminEmailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-nuevo-pedido-admin.html");
        const adminEmailHTMLContent = fs.readFileSync(adminEmailHTMLTemplate, "utf8");

        const adminEmailHTMLContentCompleted =
        adminEmailHTMLContent
            .replace("#nombre#", userData.nombre || "")
            .replace("#apellido#", userData.apellido || "")
            .replace("#email#", userEmail || "")
            .replace("#rubro#", userData.rubro || "")
            .replace("#provincia#", userData.provincia || "")
            .replace("#telefono#", userData.telefono || "")
            .replace("#celular#", userData.celular || "")
            .replace("#fecha#", getCurrentDateTime() || "")
            .replace("#total#", orderDataFromDB.total.toString() || "")
            .replace("#metodo_envio#", shippingMethodsDataFromDB.find((methodData) => methodData.id === orderDataFromDB.id_metodo_envio)?.nombre || "")
            .replace("#observaciones#", orderDataFromDB.observaciones || "")
            .replace("#tableData#", productsDataForTableHTML || "");

        const userEmailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-nuevo-pedido-user.html");
        const userEmailHTMLContent = fs.readFileSync(userEmailHTMLTemplate, "utf8");

        const userEmailHTMLContentCompleted =
        userEmailHTMLContent
            .replace("#nombre#", userData.nombre || "")
            .replace("#apellido#", userData.apellido || "")
            .replace("#fecha#", getCurrentDateTime() || "")
            .replace("#total#", orderDataFromDB.total.toString() || "")
            .replace("#metodo_envio#", shippingMethodsDataFromDB.find((methodData) => methodData.id === orderDataFromDB.id_metodo_envio)?.nombre || "")
            .replace("#observaciones#", orderDataFromDB.observaciones || "")
            .replace("#tableData#", productsDataForTableHTML || "");

        const response = await sendMails({emailsArr: [{email: userEmail}], message: userEmailHTMLContentCompleted});     //Envio de mail con los detalles de la nueva orden al usuario
        if (response.success) {
            await getDao().inserNotificationLog({recipients: userEmail, notificationType: "Nuevo pedido (Detalle para usuario)"});
        } else {
            console.error(response.message);
        }
                  
        const response6 = await getDao().getTable({tableName: "config", conditions: [{field: "seccion", value: "pedidos"}]});
        const newOrderNotificationData: Config[] | null = response6.data;
        const newOrderNotificationSubject = newOrderNotificationData? newOrderNotificationData[0].asunto : null;    
        const newOrderNotificationMails = newOrderNotificationData? newOrderNotificationData[0].destinatarios.split(";").map((email) => ({email: email.trim()})).filter((email) => email.email) : null;             //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        if (!newOrderNotificationMails || !newOrderNotificationMails.length) 
            throw new Error ("Error: No se envió la notificación de nuevo registro de usuario a la lista de admins ya que no se pudo obtener la lista de emails de destinatarios");
        if (newOrderNotificationData && newOrderNotificationData[0].activo !== "1") 
            throw new CustomError ("No se enviaron las notificaciones de nuevo registro de usuario ya que la función no está activada", 200);
                   
        const response7 = await sendMails({emailsArr: newOrderNotificationMails, message: adminEmailHTMLContentCompleted, subject: newOrderNotificationSubject });          //Envio de mails con los detalles de la nueva orden a la lista de admins seteada en tabla "config -> pedidos -> destinatarios"
        if (response7.success) {
            await getDao().inserNotificationLog({recipients: newOrderNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Nuevo pedido (Detalle para admins)"});
        } else  {
            console.error(response7.message);
        }
        
        if (response.success && response7.success) {                                                                            
            res.status(200).json({success: true, message: "", data: null} as DatabaseControllers_CustomResponse);  
        } else {                                                                                                                        //Falló algun envio de email
            res.status(200).json({success: true, message: "Orden procesada correctamente. Ocurrió un error al enviar las notificaciones con el detalle de la orden", data: null} as DatabaseControllers_CustomResponse);
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
