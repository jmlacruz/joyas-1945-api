export type MySQLActions_CustomResponse = {
    success: boolean;
    message: string;
    data: any;
}

export type DatabaseControllers_CustomResponse = MySQLActions_CustomResponse;
export type LogControllers_CustomResponse = MySQLActions_CustomResponse;
export type FunctionsCustomResponse = MySQLActions_CustomResponse;
export type MailsControllersCustomResponse = MySQLActions_CustomResponse;

export type FilterOrderByTypes = "price_asc" | "price_desc" | "alphabetic" | "default" | "date" | "random";        //Si se cambia algo de acá cambiar también el tipo en el front

export type LoginData = {
    email: string,
    password: string,
    rememberme: boolean
}

export type SessionUserData = {
    email: string,
    name: string,
    lastName: string,
    registered: boolean,
    rememberme: boolean
    isAdmin: boolean,
    streamChatToken: string,
    userId: string,
    city: string,
    token: string,
}

export type Rubro = "particular" | "Revendedor" | "comerciante" | "Local minorista" | "Local mayorista" | "Distribuidor";

export type IVACodes = "CF" | "MO" | "RI" | null | "";

export type Usuario = {
    id: number,
    login: string,
    password?: string,
    nombre: string,
    apellido: string,
    empresa: string,
    rubro: Rubro,
    direccion: string,
    cp: string,
    ciudad: string,
    provincia: string,
    pais: string,
    telefono: string,
    email: string,
    permisos: "0" | "10",
    codigo: string,
    fecha_alta: Date | string,                                  //Este campo sale de la base de datos con formato Date (y llega al front como string (no es serializable)) - El front debe enviar un formato string del tipo "yyyy-mm-dd"
    newsletter: 0 | 1,
    habilitado: "0" | "1",
    token?: string,
    celular: string,
    donde_conociste: string,
    primer_pedido: 0 | 1,                                      //Por defecto "primer_pedido" = 1, cuando se hace el primer pedido "primer_pedido" = 0 (se pasa a cero) 
    habilitado_pdj: "0" | "1",
    reviews_send: number,
    iva: IVACodes,
    cuit: number | string,                                      //Se puede enviar un string vacio desde el front
    razon: string,
    subdominio: string,
    dominio: string,
    envio_nombre: string,
    envio_dni: string,
    envio_localidad: string,
    envio_provincia: string,
    envio_cp: string,
    envio_telefono: string,
    envio_direccion: string,
    envio_tipo: "D" | "S",
    login_adj2: string,
    fecha_login_adj2: Date,
    vendedor: number | string,
    last_activity_at?: string | null,                          //DATETIME field to track last user activity for idle session timeout
};

export type Producto = {
    id: number,
    categoria: number,
    codigo: string,
    nombre: string,
    descripcion: string,
    foto1: string,
    foto2: string,
    fecha_alta: string,
    precio: number,
    colecciones: "0" | "1",
    estado: "0" | "1",
    precioCalculado: number,
    marca: number,
    order: number,
    id_grupo: number,
    notificado: "0" | "1",
    con_descuento: boolean;
	porcentaje_descuento: number;
	precio_full: number;

    thumbnail1: string,                 //Campos que agrega la API para el front
    thumbnail2: string,
    foto1NameToDelete: string,
    foto2NameToDelete: string,
    precioDolar: number,
}

export type Categoria = {
    id: number,
    nombre: string,
    orden: number,
}

export type CartItem = {
    itemId: number,
    quantity: number
    observation?: string
}

export type CartData = {
    cartItems: CartItem[]
    generalObservation?: string
};

export interface CartDataForDBFromFront {
    userEmail: string,
    cartData: CartData,
}

export interface CartDataForDBFromAPI {
    userEmail: string,
    cart: string,                           //Es un JSON
    generalObservation?: string
    cronJobId: number | null;
}

export interface CartDataFromDB {
    userEmail: string,
    cart: string,                           //Es un JSON
    generalObservation: string
    lastDate: number;
    cronJobId: number | null;
}

export type Config = {                      //Tabla de configuración de mesajería
    id: number,
    seccion: string,
    asunto: string,
    destinatarios: string,
    respuesta: string,
    activo: "0" | "1",
}

export type Marca = {
    id: number,
    orden: number,
    descripcion: string,
    fecha: string,
    imagen: string,
    pdf: string,
    pdf_recomendado: string,
    link: string,
    solapa: "0" | "1",
    estado: "0" | "1",
    logo: string,

    thumbnailImagen: string;             //Campos que agrega la API para el front
    thumbnailLogo: string;
    imagenNameToDelete: string,
    logoNameToDelete: string,

    pdfName: string,
    pdfNameToDelete: string,
    pdfRecomendadoName: string,
    pdfRecomendadoNameToDelete: string,
}

export type NewProductsOrderArr = { id: number, order: number }[];

export type PaymentMethods = "P" | "TDC" | "MP" | "B" | "";

export type Pedidos = {
    id: number,
    usuario: number,
    fecha: string,
    sesion_ip: string,
    total: number,
    estado: "0" | "1",
    observaciones: string,
    idPedido: string,
    id_metodo_envio: number,
    primer_pedido: 0 | 1,                                      //Por defecto "primer_pedido" = 1, cuando se hace el primer pedido "primer_pedido" = 0 (se pasa a cero) 
    pago_forma: PaymentMethods,
    pago_estado: "P" | "A",
    costo_envio: number,
    vendedor: number,
    printedqty: number
}

export type Detalle = {
    id_pedido: number,
    id_producto: number,
    precio: number,
    precioCalculado: number,
    cantidad: number,
    total: number,
    observaciones: string,
}

export type Log = {
    id: number,
    email: string,
    password: string,
    clave: string,
    id_usuario: string,
    ingreso: "ok" | "error",
    ip: string,
    date: string,
    time: number,
    device: string,
    device_info: string,
    origen: string
}

export type Metodo_envio = {
    id: number,
    nombre: string,
}

export type NotificationType =
    "Nuevo contacto" |
    "Nuevo usuario registrado" |
    "Cuenta en proceso de activación" |
    "Nuevo pedido (Detalle para admins)" |
    "Nuevo pedido (Detalle para usuario)" |
    "Producto deshabilitado" |
    "Carrido abandonado" |
    "Cuenta habilitada" |
    "Recuperación de contraseña (Usuario)"

export type Log_envio = {
    id: number,
    notificationType: NotificationType;
    recipients: string,
    timestamp: number,
}

export type Review = {
    id?: number,
    author_name: string,
    author_url: string,
    profile_photo_url: string,
    language: string,
    rating: number,
    relative_time_description: string,
    text: string,
    time: number,
    added: number,
    control: string,
    show: "0" | "1",
}

export type Habdeslog = {
    id?: number,
    timestamp: number,
    id_producto: number,
    prevstate: "1" | "0",
    newstate: "1" | "0",
}
