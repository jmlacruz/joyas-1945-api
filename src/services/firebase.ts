import admin from "firebase-admin";
import serviceKeys from "../credentials/firebase/joyas.json";        //Para que se puedan importar JSON hay que habilitar la opcion "resolveJsonModule": true," en "tsconfig.json"
import { FunctionsCustomResponse } from "../types/types";
import { FIREBASE_BUCKET_URL } from "../environment";

admin.initializeApp({
    credential: admin.credential.cert(serviceKeys as admin.ServiceAccount),
    storageBucket: FIREBASE_BUCKET_URL
});

const bucket = admin.storage().bucket();

const uploadFileToFirebase = async (options: {file: Buffer, filename: string, folderName: string}): Promise<FunctionsCustomResponse> => {           //Recibe un archivo de multer, lo sube a firebase y devuelve su url de descarga
    const fileBuffer = options.file;
    const fileToUpload = bucket.file(`${options.folderName}/${options.filename}`);
    await fileToUpload.save(fileBuffer);
    try {
        const url = `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET_URL}/o/${options.folderName}%2F${options.filename}?alt=media`;
        return { success: true,  message: "Archivo subido correctamente", data: url};
    } catch (err) {
        return { success: false, message: err instanceof Error ? `Error al subir archivo al bucket archivo: ${err.message}` : "Error al subir imagen al bucket: Problema desconocido", data: null };
    }
};

const deleteFileFromFirebase = async (options: {filePath: string}): Promise<FunctionsCustomResponse> => {    //Ejemplo de url: "generics/22.9.2023-17.07.03-547.FotoWatsap2.jpg"
    const fileToDelete = bucket.file(options.filePath);
    try {
        await fileToDelete.delete();
        return { success: true, data: null, message: "Archivo eliminado correctamente" };
    } catch (err) {
        return { success: false, data: null, message: err instanceof Error ? `Error al eliminar archivo de Firebase: ${err.message}` : "Error al eliminar archivo de Firebase: Problema desconocido" };
    }
};

export { deleteFileFromFirebase, uploadFileToFirebase };
