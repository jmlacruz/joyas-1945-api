import { Usuario } from "../types/types";

export const tablesForReadByFrontEnd = ["categoria", "multiplicador", "marca", "faqs", "faqs_answer", "nota", "usuario", "vendedor", "producto", "grupo", "novedad", "pano", "panoxproducto", "metodo_envio", "reviews", "system_config"];
export const tablesForWriteByFrontEnd = ["usuario"];
export const tablesForDeleteByFrontEnd = ["usuario"];

export const tablesForReadByAdmins = ["config", "pedidos", "detalle", "log", "leads", "log_envio", "habdeslog", "carts"];             /*Operaciones que solo pueden hacer los admins*/
export const tablesForWriteByAdmins = ["config", "grupo", "marca", "novedad", "pano", "multiplicador", "metodo_envio", "pedidos", "detalle", "vendedor", "log", "reviews", "leads", "panoxproducto", "producto", "faqs", "faqs_answer", "system_config"];
export const tablesForDeleteByAdmins = ["grupo", "marca", "novedad", "pano", "metodo_envio", "pedidos", "detalle", "vendedor", "log", "reviews", "leads", "panoxproducto", "producto", "faqs", "faqs_answer"];

export const tablesForReadWithOutToken = ["nota", "faqs", "faqs_answer", "novedad", "producto", "reviews"];

export const userDefaultValues: Partial<Usuario> = {
    nombre: "",
    apellido: "",
    empresa: "",
    rubro: "Revendedor",        // Rubro,
    direccion: "",
    cp: "",
    ciudad: "",
    provincia: "",
    pais: "",
    telefono: "",
    email: "",
    permisos: "0",              // "0" 1 "10"
    fecha_alta: "",
    newsletter: 0,              // 0 | 1
    habilitado: "0",            // "0" | "1",    
    celular: "",
    donde_conociste: "",
    habilitado_pdj: "0",       // "0" | "1",
    iva: "CF",                 // "CF" | "MO" | "RI" | null
    cuit: 1,                   // number | string  
    razon: "",
    envio_nombre: "",
    envio_dni: "",
    envio_localidad: "",
    envio_provincia: "",
    envio_cp: "",
    envio_telefono: "",
    envio_direccion: "",
    vendedor: 0,              // string | number,
     
    login: "",				  //Agregamos campos que no pueden ser null en el form
    codigo: "",
    token: "",
};

export const verifyTokenAPIError = "Verify Token ERROR";