import { Request, Response } from "express";
import { IMAGES_WIDTH, THUMBNAILS_WIDTH } from "../environment";
import { deleteFileFromFirebase, uploadFileToFirebase } from "../services/firebase";
import { CustomError } from "../types/customError";
import { DatabaseControllers_CustomResponse, FunctionsCustomResponse } from "../types/types";
import { generateUniqueName, getNewSize, isValidJSON, resizeImage } from "../utils/utils";

const upload = async (options: {file: Express.Multer.File, newDimensions: {width: number, height: number} | null, folderName: string}): Promise<FunctionsCustomResponse> => {
    if (options.newDimensions) {
        const resizeResponse = await resizeImage({ file: options.file, width: options.newDimensions.width, height: options.newDimensions.height });
        if (!resizeResponse.success) throw new CustomError(resizeResponse.message, 500);
        const fileResizedBuffer = resizeResponse.data as Buffer;
        const firebaseResponse = await uploadFileToFirebase({ file: fileResizedBuffer, filename: options.file.originalname, folderName: options.folderName });
        if (!firebaseResponse.success) throw new CustomError(resizeResponse.message, 500);
        return { success: true,  message: "Archivo subido correctamente", data: null};
    } else {
        const firebaseResponse = await uploadFileToFirebase({ file: options.file.buffer, filename: options.file.originalname, folderName: options.folderName });
        if (!firebaseResponse.success) throw new CustomError(firebaseResponse.message, 500);
        return { success: true,  message: "Archivo subido correctamente", data: null};
    }
};

export const handleFiles = async (req: Request, res: Response) => {
    try {

        if (!THUMBNAILS_WIDTH || !IMAGES_WIDTH) throw new CustomError("Variables de entorno de tamaños de imagen no encontradas", 500);

        const resizeImageString = req.query.resizeImage as string;                                                                                              //Si "req.query.resizeImage" no viene o es true redimensinamos las imagenes si tienen mas de 1000px de ancho
        const resizeImage = isValidJSON(resizeImageString) && typeof JSON.parse(resizeImageString) === "boolean" ? JSON.parse(resizeImageString) : true;        // la opcion de NO redimensionar es para cuando subimos imagenes de portadas por ejemplo

        const files = req.files as Express.Multer.File[];
        if (!files.length)res.status(400).json({success: false, data: null, message: "No se enviaron archivos"} as DatabaseControllers_CustomResponse);
        const fileNamesArr: string[] = [];

        for (const file of files)  {
            const fileNewName = generateUniqueName(file.originalname);
            file.originalname = fileNewName;
            const imageNewSizeResponse = getNewSize({file: file, imageNewWidth: resizeImage ? parseInt(IMAGES_WIDTH as string) : Infinity});
            const thumbnailNewSizeResponse = getNewSize({file: file, imageNewWidth: parseInt(THUMBNAILS_WIDTH as string)});
            if (!imageNewSizeResponse || !thumbnailNewSizeResponse) throw new CustomError("Error al obtener el tamaño de la imagenes", 500);
            const uploadImageResponse = await upload({file: file, newDimensions: imageNewSizeResponse.newDimensions , folderName: "images"});    
            const uploadThumbnailResponse = await upload({file: file, newDimensions: thumbnailNewSizeResponse.newDimensions, folderName: "images/thumbs"});        
            if (!uploadImageResponse.success || !uploadThumbnailResponse.success) throw new CustomError("Error al subir los archivos", 500);            
            fileNamesArr.push(fileNewName);
        }

        res.status(200).json({success: true, data: fileNamesArr, message: "Archivos subidos correctamente"} as DatabaseControllers_CustomResponse);
                   
    }  catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
};

export const deleteFiles = async (req: Request, res: Response) => {                                                 //Eliminación de imagenes
    try {

        const fileName = req.query.fileName;
        const response1 = await deleteFileFromFirebase({filePath: `images/${fileName}`});
        const response2 = await deleteFileFromFirebase({filePath: `images/thumbs/${fileName}`});
        if (!response1.success || !response2.success) throw new CustomError("Error al eliminar archivos de Firebase", 500);
        res.status(200).json({success: true, data: null, message: "Archivos eliminados correctamente"} as DatabaseControllers_CustomResponse);

    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

/********************************* Manejo de documentos (.pdf, .doc, .docx, .txt) ******************************/

export const handleDocument = async (req: Request, res: Response) => {
    try {
            
        const file = req.file as Express.Multer.File;
        if (!file)res.status(400).json({success: false, data: null, message: "No se envió el archivo"} as DatabaseControllers_CustomResponse);
       
        const fileNewName = generateUniqueName(file.originalname);
        const uploadDocumentResponse = await uploadFileToFirebase({filename: fileNewName, file: file.buffer , folderName: "documents"});    
        if (!uploadDocumentResponse.success) throw new CustomError("Error al subir los archivo a Firebase", 500);            
        
        res.status(200).json({success: true, data: fileNewName, message: "Archivos subidos correctamente"} as DatabaseControllers_CustomResponse);
                   
    }  catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
};

export const deleteDocument = async (req: Request, res: Response) => {                                             //Eliminación de documentos (.pdf, .doc, .docx, .txt)
    try {

        const documentName = req.query.documentName as string;
        if (!documentName || typeof documentName !== "string") throw new CustomError("Nombre de archivo a aliminar incorrecto", 400);
        const response1 = await deleteFileFromFirebase({filePath: `documents/${documentName}`});
        if (!response1.success) throw new CustomError("Error al eliminar archivo de Firebase", 500);
        res.status(200).json({success: true, data: null, message: "Archivo eliminado correctamente"} as DatabaseControllers_CustomResponse);

    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};
