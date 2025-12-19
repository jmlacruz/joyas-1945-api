import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

const uploadOptionsMultiple = multer ({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 2,                                          //Maximo 2MB, de lo contrario el se lanza un error del tipo multer.MulterError
        files: 2                                                            //Maximo 7 archivos, de lo contrario se lanza un error del tipo //multer.MulterError                                        
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {                                    //cb (callback) es del tipo multer.FileFilterCallback (interface) que //puede recibir 2 tipos funciones (Apretar alt y click sobre
        if (file.mimetype.startsWith("image/")) {                           //multer.FileFilterCallback
            cb(null, true);
        } else {
            const error = new Error ("Solo se permiten archivos de imagen");
            cb(error);                                                      //Si el archivo no pasa el filtro multer lanza un error en el server
        }
    }
});

const uploadOptionsSingleDocument = multer({	
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 2,                                          //Maximo 2MB
        files: 1                                                            //Maximo 1 archivo
    },
    fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {                                            
        if (                                                                //Solo se permiten documentos con formato .pdf .doc .docx o .txt
            file.mimetype.startsWith("text/plain") ||                                                                       //Permite .txt
            file.mimetype.startsWith("application/pdf") ||                                                                  //Permite .pdf
            file.mimetype.startsWith("application/vnd.openxmlformats-officedocument.wordprocessingml.document") ||          //Permite .docx
            file.mimetype.startsWith("application/msword")                                                                  //Permite .doc
        ) {                           
            cb(null, true);
        } else {
            const error = new Error("Solo se permiten archivos .pdf .doc .docx o .txt");
            cb(error);
        }
    },
});

export const uploadDocument = uploadOptionsSingleDocument.single("file");
export const uploadFiles = uploadOptionsMultiple.array("files", 2);


