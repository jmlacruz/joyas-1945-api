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
exports.printInitialActionsResponse = exports.getImageUrls = exports.getCurrentDateTime = exports.getBuyerTypeCode = exports.calculateFutureDateInHours = exports.currentDateForDB = exports.convertDateFormat = exports.getCurrentDateFormatted = exports.resizeImage = exports.getNewSize = exports.generateUniqueName = exports.isValidNoEmptyArray = exports.isValidJSON = void 0;
const image_size_1 = __importDefault(require("image-size"));
const sharp_1 = __importDefault(require("sharp"));
const environment_1 = require("../environment");
const isValidJSON = (dataJSON) => {
    if (!dataJSON)
        return false;
    try {
        JSON.parse(dataJSON);
        return true;
    }
    catch (_a) {
        return false;
    }
};
exports.isValidJSON = isValidJSON;
const isValidNoEmptyArray = (array) => {
    return array && array.length && Array.isArray(array);
};
exports.isValidNoEmptyArray = isValidNoEmptyArray;
const generateUniqueName = (name) => {
    const nameWithOutExtension = name.slice(0, name.lastIndexOf("."));
    const newFilename = new Date().toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }).replace(/[/:]/g, ".").replace(", ", "-") + "-" + new Date().getMilliseconds();
    const fileNameExtension = name.slice(name.lastIndexOf(".")).toLowerCase();
    const newFilenameWithExtension = (newFilename + "." + nameWithOutExtension + fileNameExtension).replace(/ /g, ".");
    return newFilenameWithExtension;
};
exports.generateUniqueName = generateUniqueName;
const getNewSize = (options) => {
    if (!options.imageNewWidth)
        return undefined;
    const dimensions = (0, image_size_1.default)(options.file.buffer);
    const width = dimensions.width;
    const height = dimensions.height;
    if (width && height) {
        const aspecRatio = width / height;
        if (width > options.imageNewWidth) {
            const newWidth = options.imageNewWidth;
            const newHeight = newWidth / aspecRatio;
            return { newDimensions: { width: Math.floor(newWidth), height: Math.floor(newHeight) } };
        }
        else {
            return { newDimensions: null };
        }
    }
    else {
        return undefined;
    }
};
exports.getNewSize = getNewSize;
const resizeImage = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const imageBuffer = options.file.buffer;
    try {
        const fileBuffer = yield (0, sharp_1.default)(imageBuffer).resize(options.width, options.height).toBuffer();
        return { success: true, data: fileBuffer, message: "Imagen redimensionada correctamente" };
    }
    catch (err) {
        return err instanceof Error ? { success: false, data: null, message: `Error al redimensionar imagen: ${err.message}` } : { success: false, data: null, message: "Error al redimensionar imagen: error desconocido" };
    }
});
exports.resizeImage = resizeImage;
/************************************************************************/
function getCurrentDateFormatted() {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}
exports.getCurrentDateFormatted = getCurrentDateFormatted;
function convertDateFormat(dateStr) {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
}
exports.convertDateFormat = convertDateFormat;
const currentDateForDB = () => convertDateFormat(getCurrentDateFormatted());
exports.currentDateForDB = currentDateForDB;
/************************************************************************/
const calculateFutureDateInHours = (inHours) => {
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
exports.calculateFutureDateInHours = calculateFutureDateInHours;
const getBuyerTypeCode = (buyerType) => {
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
exports.getBuyerTypeCode = getBuyerTypeCode;
const getCurrentDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
exports.getCurrentDateTime = getCurrentDateTime;
const getImageUrls = (imageInDBName) => {
    if (!imageInDBName)
        return { imageUrl: "", thumbnailUrl: "" };
    if (imageInDBName.includes("firebase/")) {
        const imageNameParsed = imageInDBName.split("firebase/")[1];
        const encodedImageName = encodeURIComponent(imageNameParsed);
        const imageUrl = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedImageName);
        const thumbnailUrl = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedImageName);
        return { imageUrl, thumbnailUrl };
    }
    else {
        const imageUrl = `${environment_1.IMAGES_FIREBASE_ROUTE}%2F${imageInDBName}?alt=media`;
        const thumbnailUrl = `${environment_1.THUMBNAILS_FIREBASE_ROUTE}%2F${imageInDBName}?alt=media`;
        return { imageUrl, thumbnailUrl };
    }
};
exports.getImageUrls = getImageUrls;
const printInitialActionsResponse = (response) => {
    if (response.message)
        response.success ? console.info(response.message) : console.error(response.message);
};
exports.printInitialActionsResponse = printInitialActionsResponse;
//# sourceMappingURL=utils.js.map