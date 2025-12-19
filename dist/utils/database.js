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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOrder = exports.getGlobalMultiplier = void 0;
const dao_1 = require("../dao");
const customError_1 = require("../types/customError");
const utils_1 = require("./utils");
const getGlobalMultiplier = () => __awaiter(void 0, void 0, void 0, function* () {
    const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "multiplicador" });
    if (!response1.success || !response1.data || !response1.data.length)
        throw new customError_1.CustomError("Error al obtener multiplicador global", 500);
    const globalMultiplier = response1.data[0].valor;
    return globalMultiplier;
});
exports.getGlobalMultiplier = getGlobalMultiplier;
const generateOrder = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const { userEmail, orderData } = data;
    const userBuyerData = { cuit: orderData.buyerData.CUIT || orderData.buyerData.DNI, razon: orderData.buyerData["Razón Social"] || orderData.buyerData["Nombre Completo"] };
    const userBuyerTypeCode = (0, utils_1.getBuyerTypeCode)(orderData.buyerType);
    const userBuyerCode = { iva: userBuyerTypeCode };
    const response0 = yield (0, dao_1.getDao)().updateTable({ tableName: "usuario", conditions: [{ field: "email", value: userEmail }], data: Object.assign(Object.assign({}, userBuyerData), userBuyerCode) });
    if (!response0.success || !response0.data)
        console.error("No se pudieron actualizar los datos fiscales del cliente al crear pedido (CUIT, DNI, Razón social, Nombre completo)");
    const userDataFields = ["id", "primer_pedido", "vendedor"];
    const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", conditions: [{ field: "email", value: userEmail }], fields: userDataFields });
    if (!response1.success || !response1.data || !response1.data.length)
        return { success: false, message: `Error al obtener datos del usuario: ${response1.message}`, data: null };
    const userData = response1.data[0];
    const cartDataFields = ["cart", "generalObservation"];
    const response2 = yield (0, dao_1.getDao)().getTable({ tableName: "carts", conditions: [{ field: "userEmail", value: userEmail }], fields: cartDataFields });
    if (!response2.success || !response2.data || !response2.data.length)
        return { success: false, message: `Error al obtener datos del carrito: ${response2.message}`, data: null };
    const cartData = response2.data[0];
    const { cart: cartJSON, generalObservation } = cartData;
    let cart;
    try {
        if (typeof cartJSON === "object" && cartJSON !== null) {
            if (Array.isArray(cartJSON)) {
                cart = cartJSON;
            }
            else {
                cart = cartJSON.cartItems || cartJSON;
            }
        }
        else if (typeof cartJSON === "string") {
            cart = JSON.parse(cartJSON);
        }
        else {
            throw new Error(`Unexpected cart data type: ${typeof cartJSON}`);
        }
        if (!Array.isArray(cart)) {
            throw new Error("Cart data is not an array");
        }
    }
    catch (error) {
        return { success: false, message: `Error al parsear datos del carrito: ${error instanceof Error ? error.message : "Invalid JSON format"}`, data: null };
    }
    const cartItemsIDs = cart.map((item) => item.itemId);
    const response4 = yield (0, dao_1.getDao)().getTable({ tableName: "multiplicador" });
    if (!response4.success || !response4.data || !response4.data.length)
        return { success: false, message: `Error al obtener datos multiplicador de precios: ${response4.message}`, data: null };
    const globalMultiplier = response4.data[0].valor;
    const productsDataFields = ["precio", "id"];
    const response3 = yield (0, dao_1.getDao)().getProductsByIDs({ fieldsArr: productsDataFields, productsIDsArr: cartItemsIDs });
    if (!response3.success || !response3.data || !response3.data.length)
        return { success: false, message: `Error al obtener datos de productos: ${response3.message}`, data: null };
    const productsData = response3.data;
    const productsDataWithAditionalInfo = productsData.map((product) => {
        const cartItem = cart.find((item) => item.itemId === product.id);
        return (Object.assign(Object.assign({}, product), { quantity: (cartItem === null || cartItem === void 0 ? void 0 : cartItem.quantity) || 0, observation: (cartItem === null || cartItem === void 0 ? void 0 : cartItem.observation) || "" }));
    });
    if (productsDataWithAditionalInfo.some((product) => !product.quantity))
        return { success: false, message: "Error al obtener datos de cantidad productos", data: null };
    const totalInArs = productsDataWithAditionalInfo.reduce((acc, product) => acc + (Math.ceil(product.precio * globalMultiplier) * product.quantity), 0); //Hacemos el mismo calculo que cuando convertimos los precios en la API antes de enviarlos al front
    const totalParsed = parseFloat(totalInArs.toFixed(2));
    let pago_forma;
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
    const orderDataToInsert = {
        usuario: userData.id,
        fecha: (0, utils_1.currentDateForDB)(),
        sesion_ip: orderData.clientIP || "",
        total: totalParsed,
        estado: "0",
        observaciones: generalObservation,
        id_metodo_envio: orderData.shippingMethodID || 0, //Si el id de metodo de envio recibido del front es null seteamos el valor en cero para poder detectar el error en el dashboard (los ids empiezan de 1)
        primer_pedido: userData.primer_pedido,
        pago_forma,
        pago_estado: "P",
        vendedor: userData.vendedor, //Si el dato viene de la base de datos es un numero
        idPedido: "", //"idPedido" no puede ser NULL en produccion
        costo_envio: 0, //"costo_envio" no puede ser NULL en produccion                                                                 
    };
    const response5 = yield (0, dao_1.getDao)().insertRow({ tableName: "pedidos", data: orderDataToInsert });
    if (!response5.success || !response5.data || !response5.data.length)
        return { success: false, message: `Error al agregar orden a la base de datos: ${response5.message}`, data: null };
    const newOrderID = response5.data[0];
    const detailsRows = productsDataWithAditionalInfo.map((product) => ({
        id_pedido: newOrderID,
        id_producto: product.id,
        precio: product.precio,
        precioCalculado: globalMultiplier,
        cantidad: product.quantity,
        total: Math.ceil(product.precio * globalMultiplier) * product.quantity,
        observaciones: product.observation,
    }));
    const response6 = yield (0, dao_1.getDao)().insertRow({ tableName: "detalle", data: detailsRows });
    if (!response6.success || !response6.data || !response6.data.length) {
        yield (0, dao_1.getDao)().deleteRowById({ tableName: "pedidos", rowID: newOrderID });
        return { success: false, message: `Error al agregar datos de productos de orden en la base de datos. No se pudo generar el pedido: ${response6.message}`, data: null };
    }
    if (userData.primer_pedido === 1)
        yield (0, dao_1.getDao)().updateTable({ tableName: "usuario", conditions: [{ field: "email", value: userEmail }], data: { primer_pedido: 0 } });
    return { success: true, message: `Orden creada con éxito con ID: ${response5.data}`, data: response5.data };
});
exports.generateOrder = generateOrder;
//# sourceMappingURL=database.js.map