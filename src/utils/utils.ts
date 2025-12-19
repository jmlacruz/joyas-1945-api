import sizeOf from "image-size";
import sharp from "sharp";
import { IMAGES_FIREBASE_ROUTE, IMAGES_ROUTE, THUMBNAILS_FIREBASE_ROUTE, THUMBNAILS_ROUTE } from "../environment";
import { FutureDateForCronJob } from "../types/misc";
import { BuyerTypeOptions } from "../types/orders";
import { FunctionsCustomResponse, IVACodes, MySQLActions_CustomResponse } from "../types/types";

export const isValidJSON = (dataJSON: string | null) => {
    if (!dataJSON) return false;
    try {
        JSON.parse(dataJSON);
        return true;
    } catch {
        return false;
    }
};

export const isValidNoEmptyArray = (array: any) => {
    return array && array.length && Array.isArray(array);
};

export const generateUniqueName = (name: string) => {         
    const nameWithOutExtension = name.slice(0, name.lastIndexOf("."));                                                                              
    const newFilename = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }).replace(/[/:]/g, ".").replace(", ", "-") + "-" + new Date().getMilliseconds();     
    const fileNameExtension = name.slice(name.lastIndexOf(".")).toLowerCase();                                                                 
    const newFilenameWithExtension = (newFilename + "." + nameWithOutExtension + fileNameExtension).replace(/ /g, ".");
    return newFilenameWithExtension;
};

export const getNewSize = (options: {file: Express.Multer.File, imageNewWidth: number | undefined}) : {newDimensions: {width: number, height: number} | null} | undefined => {
    if (!options.imageNewWidth) return undefined;
    const dimensions = sizeOf(options.file.buffer);
    const width = dimensions.width;
    const height = dimensions.height;
    if (width && height) {
        const aspecRatio = width / height;
        if (width > options.imageNewWidth) {
            const newWidth = options.imageNewWidth;
            const newHeight = newWidth / aspecRatio;
            return {newDimensions: {width: Math.floor(newWidth), height: Math.floor(newHeight)}};
        } else {
            return {newDimensions: null};
        }
    } else {
        return undefined;
    }
};

export const resizeImage = async (options: {file: Express.Multer.File, width: number, height: number}) : Promise<FunctionsCustomResponse> => {             
    const imageBuffer = options.file.buffer;
    try {
        const fileBuffer = await sharp(imageBuffer).resize(options.width, options.height).toBuffer();
        return {success: true, data: fileBuffer, message: "Imagen redimensionada correctamente"};
    } catch (err) {
        return err instanceof Error ? {success: false, data: null, message: `Error al redimensionar imagen: ${err.message}`} : {success: false, data: null, message: "Error al redimensionar imagen: error desconocido"};
    }
};

/************************************************************************/

export function getCurrentDateFormatted () {													        //Obtiene la fecha actual en formato "dd/mm/yyyy" para que reciba el input si de la base de datos viene el campo de fecha nulo
    const date = new Date(); 
    const day = String(date.getDate()).padStart(2, "0"); 
    const month = String(date.getMonth() + 1).padStart(2, "0"); 
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

export function convertDateFormat(dateStr: string) {										            //Pasa de formaro "dd/mm/yyyy" a "yyyy-mm-dd" (que acepta mySQL)
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
}

export const currentDateForDB = () => convertDateFormat(getCurrentDateFormatted());

/************************************************************************/

export const calculateFutureDateInHours = (inHours: number): FutureDateForCronJob => {
    // Obtiene la fecha y hora actuales
    const now = new Date();

    // Calcula la fecha y hora futuras sumando las horas proporcionadas
    const futureDate = new Date(now.getTime() + inHours * 60 * 60 * 1000);

    // Convierte la fecha futura a la zona horaria de Buenos Aires (UTC-3)
    const buenosAiresOffset = -3 * 60; // Buenos Aires UTC offset en minutos
    const futureDateInBA = new Date(futureDate.getTime() + buenosAiresOffset * 60 * 1000);

    // Extrae los componentes de la fecha futura
    const mdays = futureDateInBA.getUTCDate();
    const wdays = futureDateInBA.getUTCDay();
    const hours = futureDateInBA.getUTCHours();
    const minutes = futureDateInBA.getUTCMinutes();
    const months = futureDateInBA.getUTCMonth() + 1; // Los meses en JavaScript van de 0 a 11, por lo que se suma 1

    // Retorna el momento futuro en el formato solicitado
    return {
        mdays,
        months,
        hours,
        minutes,
        wdays,
    };
};

export const getBuyerTypeCode = (buyerType: BuyerTypeOptions | undefined): IVACodes => {
    switch (buyerType) {
    case "Consumidor Final":
        return "CF";
    case "Responsable Inscripto":
        return "RI";
    case "Monotributista":
        return "MO";
    default:
        return "";
    }
};

export const getCurrentDateTime = () => {                                                                    //Genera la fecha y hora actual en formato de tipo 2024-9-22 19:05:26 para los ogs de usuario
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); 
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const getImageUrls = (imageInDBName: string) => {
    if (!imageInDBName) return {imageUrl: "", thumbnailUrl: ""};
    // if (imageInDBName.includes("firebase/")) {
    //     const imageNameParsed = imageInDBName.split("/")[1];
    //     const imageUrl = IMAGES_FIREBASE_ROUTE?.replace("_", imageNameParsed);
    //     const thumbnailUrl = THUMBNAILS_FIREBASE_ROUTE?.replace("_", imageNameParsed);
    //     return {imageUrl, thumbnailUrl};
    // } else
    {
        const imageUrl = `${IMAGES_ROUTE}/${imageInDBName}`;
        const thumbnailUrl = `${THUMBNAILS_ROUTE}/${imageInDBName}`;
        // const imageUrl = `${IMAGES_ROUTE}%2F${imageInDBName}?alt=media`;
        // const thumbnailUrl = `${THUMBNAILS_ROUTE}%2F${imageInDBName}?alt=media`;
        return {imageUrl, thumbnailUrl};
    }
};

export const printInitialActionsResponse = (response: MySQLActions_CustomResponse) => {
    if (response.message) response.success ? console.info(response.message) : console.error(response.message);
};