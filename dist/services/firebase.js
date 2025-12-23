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
exports.uploadFileToFirebase = exports.deleteFileFromFirebase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const environment_1 = require("../environment");
// Construir ServiceAccount desde variables de entorno
const getServiceAccount = () => {
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
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        tokenUri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        universeDomain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
    };
};
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(getServiceAccount()),
    storageBucket: environment_1.FIREBASE_BUCKET_URL
});
const bucket = firebase_admin_1.default.storage().bucket();
const uploadFileToFirebase = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const fileBuffer = options.file;
    const fileToUpload = bucket.file(`${options.folderName}/${options.filename}`);
    yield fileToUpload.save(fileBuffer);
    try {
        const url = `https://firebasestorage.googleapis.com/v0/b/${environment_1.FIREBASE_BUCKET_URL}/o/${options.folderName}%2F${options.filename}?alt=media`;
        return { success: true, message: "Archivo subido correctamente", data: url };
    }
    catch (err) {
        return { success: false, message: err instanceof Error ? `Error al subir archivo al bucket archivo: ${err.message}` : "Error al subir imagen al bucket: Problema desconocido", data: null };
    }
});
exports.uploadFileToFirebase = uploadFileToFirebase;
const deleteFileFromFirebase = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const fileToDelete = bucket.file(options.filePath);
    try {
        yield fileToDelete.delete();
        return { success: true, data: null, message: "Archivo eliminado correctamente" };
    }
    catch (err) {
        return { success: false, data: null, message: err instanceof Error ? `Error al eliminar archivo de Firebase: ${err.message}` : "Error al eliminar archivo de Firebase: Problema desconocido" };
    }
});
exports.deleteFileFromFirebase = deleteFileFromFirebase;
//# sourceMappingURL=firebase.js.map