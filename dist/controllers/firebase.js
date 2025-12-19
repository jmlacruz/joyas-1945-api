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
exports.deleteDocument = exports.handleDocument = exports.deleteFiles = exports.handleFiles = void 0;
const environment_1 = require("../environment");
const firebase_1 = require("../services/firebase");
const customError_1 = require("../types/customError");
const utils_1 = require("../utils/utils");
const upload = (options) => __awaiter(void 0, void 0, void 0, function* () {
    if (options.newDimensions) {
        const resizeResponse = yield (0, utils_1.resizeImage)({ file: options.file, width: options.newDimensions.width, height: options.newDimensions.height });
        if (!resizeResponse.success)
            throw new customError_1.CustomError(resizeResponse.message, 500);
        const fileResizedBuffer = resizeResponse.data;
        const firebaseResponse = yield (0, firebase_1.uploadFileToFirebase)({ file: fileResizedBuffer, filename: options.file.originalname, folderName: options.folderName });
        if (!firebaseResponse.success)
            throw new customError_1.CustomError(resizeResponse.message, 500);
        return { success: true, message: "Archivo subido correctamente", data: null };
    }
    else {
        const firebaseResponse = yield (0, firebase_1.uploadFileToFirebase)({ file: options.file.buffer, filename: options.file.originalname, folderName: options.folderName });
        if (!firebaseResponse.success)
            throw new customError_1.CustomError(firebaseResponse.message, 500);
        return { success: true, message: "Archivo subido correctamente", data: null };
    }
});
const handleFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.THUMBNAILS_WIDTH || !environment_1.IMAGES_WIDTH)
            throw new customError_1.CustomError("Variables de entorno de tamaños de imagen no encontradas", 500);
        const resizeImageString = req.query.resizeImage; //Si "req.query.resizeImage" no viene o es true redimensinamos las imagenes si tienen mas de 1000px de ancho
        const resizeImage = (0, utils_1.isValidJSON)(resizeImageString) && typeof JSON.parse(resizeImageString) === "boolean" ? JSON.parse(resizeImageString) : true; // la opcion de NO redimensionar es para cuando subimos imagenes de portadas por ejemplo
        const files = req.files;
        if (!files.length)
            res.status(400).json({ success: false, data: null, message: "No se enviaron archivos" });
        const fileNamesArr = [];
        for (const file of files) {
            const fileNewName = (0, utils_1.generateUniqueName)(file.originalname);
            file.originalname = fileNewName;
            const imageNewSizeResponse = (0, utils_1.getNewSize)({ file: file, imageNewWidth: resizeImage ? parseInt(environment_1.IMAGES_WIDTH) : Infinity });
            const thumbnailNewSizeResponse = (0, utils_1.getNewSize)({ file: file, imageNewWidth: parseInt(environment_1.THUMBNAILS_WIDTH) });
            if (!imageNewSizeResponse || !thumbnailNewSizeResponse)
                throw new customError_1.CustomError("Error al obtener el tamaño de la imagenes", 500);
            const uploadImageResponse = yield upload({ file: file, newDimensions: imageNewSizeResponse.newDimensions, folderName: "images" });
            const uploadThumbnailResponse = yield upload({ file: file, newDimensions: thumbnailNewSizeResponse.newDimensions, folderName: "images/thumbs" });
            if (!uploadImageResponse.success || !uploadThumbnailResponse.success)
                throw new customError_1.CustomError("Error al subir los archivos", 500);
            fileNamesArr.push(fileNewName);
        }
        res.status(200).json({ success: true, data: fileNamesArr, message: "Archivos subidos correctamente" });
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.handleFiles = handleFiles;
const deleteFiles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileName = req.query.fileName;
        const response1 = yield (0, firebase_1.deleteFileFromFirebase)({ filePath: `images/${fileName}` });
        const response2 = yield (0, firebase_1.deleteFileFromFirebase)({ filePath: `images/thumbs/${fileName}` });
        if (!response1.success || !response2.success)
            throw new customError_1.CustomError("Error al eliminar archivos de Firebase", 500);
        res.status(200).json({ success: true, data: null, message: "Archivos eliminados correctamente" });
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.deleteFiles = deleteFiles;
/********************************* Manejo de documentos (.pdf, .doc, .docx, .txt) ******************************/
const handleDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        if (!file)
            res.status(400).json({ success: false, data: null, message: "No se envió el archivo" });
        const fileNewName = (0, utils_1.generateUniqueName)(file.originalname);
        const uploadDocumentResponse = yield (0, firebase_1.uploadFileToFirebase)({ filename: fileNewName, file: file.buffer, folderName: "documents" });
        if (!uploadDocumentResponse.success)
            throw new customError_1.CustomError("Error al subir los archivo a Firebase", 500);
        res.status(200).json({ success: true, data: fileNewName, message: "Archivos subidos correctamente" });
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.handleDocument = handleDocument;
const deleteDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentName = req.query.documentName;
        if (!documentName || typeof documentName !== "string")
            throw new customError_1.CustomError("Nombre de archivo a aliminar incorrecto", 400);
        const response1 = yield (0, firebase_1.deleteFileFromFirebase)({ filePath: `documents/${documentName}` });
        if (!response1.success)
            throw new customError_1.CustomError("Error al eliminar archivo de Firebase", 500);
        res.status(200).json({ success: true, data: null, message: "Archivo eliminado correctamente" });
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.deleteDocument = deleteDocument;
//# sourceMappingURL=firebase.js.map