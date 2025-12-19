import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { CURRENT_API_BASE_URL, THUMBNAILS_ROUTE } from "../environment";
import { sendMails } from "../services/mails";
import { CustomError } from "../types/customError";
import { Categoria, Config, MailsControllersCustomResponse, Marca, Producto } from "../types/types";
import { getDao } from "../dao";

export const productDisabled = async (req: Request, res: Response) => {    
    try {                                                                                                                          
        if (!CURRENT_API_BASE_URL) throw new Error ("Error interno del servidor. Variable de entorno para envío de notificación por producto deshabilitado no disponible - (productDisabled)");               
        const {productID} = req.query as {productID: string};       
        const productIDparsed = parseInt(productID);
        if (!productIDparsed) throw new Error ("Error: El ID del producto deshabilitado tiene tipo incorrecto");
        
        const response = await getDao().getTable({tableName: "producto", conditions: [{field: "id", value: productIDparsed}]});
        if (!response.success || !response.data || !response.data.length) throw new Error ("Error: No se pudo obtener el producto deshabilitado de la base de datos");
        const productData: Producto = response.data[0];

        const brandFields: (keyof Marca)[] = ["id", "descripcion"];
        const response1 = await getDao().getTable({tableName: "marca", fields: brandFields});
        if (!response1.success || !response1.data || !response1.data.length) throw new Error ("Error: No se pudieron obtener los datos de marcas de la base de datos, para la notificación de producto deshabilitado");
        const brandsData: Marca[] = response1.data;

        const categoryFields: (keyof Categoria)[] = ["id", "nombre"];
        const response2 = await getDao().getTable({tableName: "categoria", fields: categoryFields});
        if (!response2.success || !response2.data || !response2.data.length) throw new Error ("Error: No se pudieron obtener los datos de categorías de la base de datos, para la notificación de producto deshabilitado");
        const categoriesData: Categoria[] = response2.data;

        const brandName = brandsData.find((brand) => brand.id === productData.marca)?.descripcion;
        const categoryName = categoriesData.find((category) => category.id === productData.categoria)?.nombre;

        const foto1Name = productData.foto1;
        const foto1ThumbnailUrl = `${THUMBNAILS_ROUTE || ""}/${foto1Name}`;

        /* Notificacion por mail a lista de emails seteada en el dashboard */

        const adminEmailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-producto-deshabilitado.html");
        const adminEmailHTMLContent = fs.readFileSync(adminEmailHTMLTemplate, "utf8");
   
        const adminEmailHTMLContentCompleted =
        adminEmailHTMLContent
            .replace("#codigo#", productData.codigo || "")
            .replace("#nombre#", productData.nombre || "")
            .replace("#categoria#", categoryName || "")
            .replace("#marca#", brandName || "")
            .replace("#precio#", productData.precio.toString() || "")
            .replace("#fotoUrl#", foto1ThumbnailUrl || "");

        const response3 = await getDao().getTable({tableName: "config", conditions: [{field: "seccion", value: "producto_deshabilitado"}]});
        const productDisabledNotificationData: Config[] | null= response3.data;
        const productDisabledNotificationSubject = productDisabledNotificationData? productDisabledNotificationData[0].asunto : null;    
        const productDisabledNotificationMails = productDisabledNotificationData? productDisabledNotificationData[0].destinatarios.split(";").map((email) => ({email: email.trim()})).filter((email) => email.email) : null;             //El filter es para sacar los email que son string vacios por si ponemos por ejemplo "direccion@gmail.com;direccion@gmail.com;" con punto y coma al final en la ultima direccion
        if (!productDisabledNotificationMails || !productDisabledNotificationMails.length) 
            throw new Error ("Error: No se envió la notificación por producto deshabilitado ya que no se pudieron obtener el/los email/s de la lista de destinatarios");
        if (productDisabledNotificationData && productDisabledNotificationData[0].activo !== "1") 
            throw new CustomError ("No se enviaron las notificaciones por producto deshabilitado ya que la función no está activada", 200);
  
        const response4 = await sendMails({emailsArr: productDisabledNotificationMails, message: adminEmailHTMLContentCompleted, subject: productDisabledNotificationSubject});
        if (response4.success) {
            await getDao().inserNotificationLog({recipients: productDisabledNotificationMails.map((mail) => mail.email).join(" - "), notificationType: "Producto deshabilitado"});
        } else  {
            throw new Error ("Error: No se pudieron enviar las notificaciones por producto deshabilitado: " + response4.message);
        }
        res.status(200).json(response4 as MailsControllersCustomResponse);
       
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