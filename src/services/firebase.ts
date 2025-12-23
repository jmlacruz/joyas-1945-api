import admin from "firebase-admin";
import { FIREBASE_BUCKET_URL } from "../environment";
import { FunctionsCustomResponse } from "../types/types";

// Construir ServiceAccount desde variables de entorno
const getServiceAccount = (): admin.ServiceAccount => {
    const requiredEnvVars = [
        "FIREBASE_PROJECT_ID",
        "FIREBASE_PRIVATE_KEY_ID",
        "FIREBASE_PRIVATE_KEY",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_CLIENT_ID",
        "FIREBASE_CLIENT_X509_CERT_URL"
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
        throw new Error(`Faltan variables de entorno requeridas para Firebase: ${missingVars.join(", ")}`);
    }

    return {
        type: "service_account",
        projectId: process.env.FIREBASE_PROJECT_ID!,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        clientId: process.env.FIREBASE_CLIENT_ID!,
        authUri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        tokenUri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL!,
        universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
    } as admin.ServiceAccount;
};

admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
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
