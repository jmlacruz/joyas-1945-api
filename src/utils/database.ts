import { getDao } from "../dao";
import { CustomError } from "../types/customError";
import { OrderData } from "../types/orders";
import { CartDataFromDB, CartItem, Detalle, MySQLActions_CustomResponse, PaymentMethods, Pedidos, Producto, Usuario } from "../types/types";
import { currentDateForDB, getBuyerTypeCode } from "./utils";

export const getGlobalMultiplier = async () => {
    const response1 = await getDao().getTable({tableName: "multiplicador"});
    if (!response1.success || !response1.data || !response1.data.length) throw new CustomError("Error al obtener multiplicador global", 500);
    const globalMultiplier = response1.data[0].valor;
    return globalMultiplier;
};

export const generateOrder = async (data: {userEmail: string, orderData: OrderData}) : Promise <MySQLActions_CustomResponse> => {
    const {userEmail, orderData} = data;

    const userBuyerData: Partial<Usuario> = {cuit: orderData.buyerData.CUIT || orderData.buyerData.DNI, razon: orderData.buyerData["Razón Social"] || orderData.buyerData["Nombre Completo"]};
    const userBuyerTypeCode = getBuyerTypeCode(orderData.buyerType);
    const userBuyerCode: Partial<Usuario> = {iva: userBuyerTypeCode};
    const response0 = await getDao().updateTable({tableName: "usuario", conditions: [{field: "email", value: userEmail}], data: {...userBuyerData, ...userBuyerCode}});
    if (!response0.success || !response0.data) console.error ("No se pudieron actualizar los datos fiscales del cliente al crear pedido (CUIT, DNI, Razón social, Nombre completo)");

    const userDataFields: (keyof Usuario)[] = ["id", "primer_pedido", "vendedor"];
    const response1 = await getDao().getTable({tableName: "usuario", conditions: [{field: "email", value: userEmail}], fields: userDataFields});
    if (!response1.success || !response1.data || !response1.data.length) return {success: false, message: `Error al obtener datos del usuario: ${response1.message}`, data: null};
    const userData: Pick<Usuario, "id" | "primer_pedido" | "vendedor"> = response1.data[0];

    const cartDataFields: (keyof CartDataFromDB)[] = ["cart", "generalObservation"];
    const response2 = await getDao().getTable({tableName: "carts", conditions: [{field: "userEmail", value: userEmail}], fields: cartDataFields});
    if (!response2.success || !response2.data || !response2.data.length) return {success: false, message: `Error al obtener datos del carrito: ${response2.message}`, data: null};
    const cartData: Pick<CartDataFromDB, "cart" | "generalObservation"> = response2.data[0];
    const {cart: cartJSON, generalObservation} = cartData;
    
    let cart: CartItem[];
    try {
        if (typeof cartJSON === "object" && cartJSON !== null) {
            if (Array.isArray(cartJSON)) {
                cart = cartJSON;
            } else {
                cart = (cartJSON as any).cartItems || cartJSON;
            }
        } else if (typeof cartJSON === "string") {
            cart = JSON.parse(cartJSON);
        } else {
            throw new Error(`Unexpected cart data type: ${typeof cartJSON}`);
        }
        
        if (!Array.isArray(cart)) {
            throw new Error("Cart data is not an array");
        }
    } catch (error) {
        return {success: false, message: `Error al parsear datos del carrito: ${error instanceof Error ? error.message : "Invalid JSON format"}`, data: null};
    }
    const cartItemsIDs = cart.map((item) => item.itemId);

    const response4 = await getDao().getTable({tableName: "multiplicador"});
    if (!response4.success || !response4.data || !response4.data.length) return {success: false, message: `Error al obtener datos multiplicador de precios: ${response4.message}`, data: null};
    const globalMultiplier = response4.data[0].valor;
    
    const productsDataFields: (keyof Producto)[] = ["precio", "id"];
    const response3 = await getDao().getProductsByIDs({fieldsArr: productsDataFields, productsIDsArr: cartItemsIDs});
    if (!response3.success || !response3.data || !response3.data.length) return {success: false, message: `Error al obtener datos de productos: ${response3.message}`, data: null};
    const productsData: Pick<Producto, "precio" | "id">[] = response3.data;
    type AditionalInfo = Required<Pick<CartItem, "quantity" | "observation">>;
    const productsDataWithAditionalInfo: (Pick<Producto, "precio" | "id"> & AditionalInfo)[] = productsData.map((product) => 
    {
        const cartItem = cart.find((item) => item.itemId === product.id);
        return ({ ...product, quantity: cartItem?.quantity || 0, observation: cartItem?.observation || ""});
    });
    if (productsDataWithAditionalInfo.some((product) => !product.quantity)) return {success: false, message: "Error al obtener datos de cantidad productos", data: null};
    const totalInArs = productsDataWithAditionalInfo.reduce((acc, product) => acc + (Math.ceil(product.precio * globalMultiplier) * product.quantity!), 0);           //Hacemos el mismo calculo que cuando convertimos los precios en la API antes de enviarlos al front
    
    const totalParsed = parseFloat(totalInArs.toFixed(2));

    let pago_forma: PaymentMethods;

    switch (orderData.paymentMethod) {
    case "Lo resuelvo personalmente":
        pago_forma = "P";
        break;
    case "Transferencia o depósito bancario":
        pago_forma = "TDC";
        break;
    default:
        pago_forma = "";
    }
    
    const orderDataToInsert: Partial<Pedidos> = {
        usuario: userData.id, 
        fecha: currentDateForDB(), 
        sesion_ip: orderData.clientIP || "",
        total: totalParsed,
        estado: "0",
        observaciones: generalObservation,
        id_metodo_envio: orderData.shippingMethodID || 0,                                               //Si el id de metodo de envio recibido del front es null seteamos el valor en cero para poder detectar el error en el dashboard (los ids empiezan de 1)
        primer_pedido: userData.primer_pedido,
        pago_forma,
        pago_estado: "P",
        vendedor: userData.vendedor as number,                                                          //Si el dato viene de la base de datos es un numero
        idPedido: "",                                                                                   //"idPedido" no puede ser NULL en produccion
        costo_envio: 0,                                                                                 //"costo_envio" no puede ser NULL en produccion                                                                 
    };  

    const response5 = await getDao().insertRow({tableName: "pedidos", data: orderDataToInsert});
    if (!response5.success || !response5.data || !response5.data.length) return {success: false, message: `Error al agregar orden a la base de datos: ${response5.message}`, data: null};
    const newOrderID = response5.data[0] as number;

    const detailsRows: Detalle[] = productsDataWithAditionalInfo.map((product) => (
        {   
            id_pedido: newOrderID, 
            id_producto: product.id, 
            precio: product.precio, 
            precioCalculado: globalMultiplier, 
            cantidad: product.quantity,
            total: Math.ceil(product.precio * globalMultiplier) * product.quantity,
            observaciones: product.observation,
        }
    ));
    const response6 = await getDao().insertRow({tableName: "detalle", data: detailsRows});
    if (!response6.success || !response6.data || !response6.data.length) {
        await getDao().deleteRowById({tableName: "pedidos", rowID: newOrderID});
        return {success: false, message: `Error al agregar datos de productos de orden en la base de datos. No se pudo generar el pedido: ${response6.message}`, data: null};
    }        
        
    if (userData.primer_pedido === 1) await getDao().updateTable({tableName: "usuario", conditions: [{field: "email", value: userEmail}], data: {primer_pedido: 0}});
     
    return {success: true, message: `Orden creada con éxito con ID: ${response5.data}`, data: response5.data};
};
