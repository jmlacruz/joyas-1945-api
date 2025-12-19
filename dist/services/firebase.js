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
const joyas_json_1 = __importDefault(require("../credentials/firebase/joyas.json")); //Para que se puedan importar JSON hay que habilitar la opcion "resolveJsonModule": true," en "tsconfig.json"
const environment_1 = require("../environment");
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(joyas_json_1.default),
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