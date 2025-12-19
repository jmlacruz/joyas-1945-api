import { SessionUserData } from "./types";

declare global {                                            //Agregamos la propiedad "decoded" de tipo {email: string, name: string} al objeto "req" de express (tipo "Request")
    namespace Express {                                     // en este caso el archivo debe ser extension ".d.ts", y debe ir la sentencia "declare namespace Express" sino no funca
        interface Request {
            decoded: SessionUserData;  
        }
    }
}
