"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFiles = exports.uploadDocument = void 0;
const multer_1 = __importDefault(require("multer"));
const uploadOptionsMultiple = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 2, //Maximo 2MB, de lo contrario el se lanza un error del tipo multer.MulterError
        files: 2 //Maximo 7 archivos, de lo contrario se lanza un error del tipo //multer.MulterError                                        
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) { //multer.FileFilterCallback
            cb(null, true);
        }
        else {
            const error = new Error("Solo se permiten archivos de imagen");
            cb(error); //Si el archivo no pasa el filtro multer lanza un error en el server
        }
    }
});
const uploadOptionsSingleDocument = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 2, //Maximo 2MB
        files: 1 //Maximo 1 archivo
    },
    fileFilter: (_req, file, cb) => {
        if ( //Solo se permiten documentos con formato .pdf .doc .docx o .txt
        file.mimetype.startsWith("text/plain") || //Permite .txt
            file.mimetype.startsWith("application/pdf") || //Permite .pdf
            file.mimetype.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document") || //Permite .docx
            file.mimetype.startsWith("application/msword") //Permite .doc
        ) {
            cb(null, true);
        }
        else {
            const error = new Error("Solo se permiten archivos .pdf .doc .docx o .txt");
            cb(error);
        }
    },
});
exports.uploadDocument = uploadOptionsSingleDocument.single("file");
exports.uploadFiles = uploadOptionsMultiple.array("files", 2);
//# sourceMappingURL=multer.js.map