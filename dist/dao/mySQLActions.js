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
exports.mySQLActions = void 0;
const knex_1 = __importDefault(require("knex"));
const environment_1 = require("../environment");
const utils_1 = require("../utils/utils");
const validations_1 = require("../validations");
const mySQLLocalConfig = {
    client: "mysql2",
    connection: {
        host: environment_1.mySQL_LocalConfig.host,
        user: environment_1.mySQL_LocalConfig.user,
        password: environment_1.mySQL_LocalConfig.password,
        database: environment_1.mySQL_LocalConfig.databaseName,
        ssl: environment_1.mySQL_LocalConfig.ssl,
        port: environment_1.mySQL_LocalConfig.port,
    }
};
const mySQLRemoteConfig = {
    client: "mysql2",
    connection: {
        host: environment_1.mySQL_RemoteConfig.host,
        user: environment_1.mySQL_RemoteConfig.user,
        password: environment_1.mySQL_RemoteConfig.password,
        database: environment_1.mySQL_RemoteConfig.databaseName,
        ssl: environment_1.mySQL_RemoteConfig.ssl,
        port: environment_1.mySQL_RemoteConfig.port,
    }
};
let mySQLClient;
class mySQLActions {
    constructor() {
        this.connect = () => __awaiter(this, void 0, void 0, function* () {
            try {
                mySQLClient = environment_1.NODE_ENV === "production" ? (0, knex_1.default)(mySQLRemoteConfig) : (0, knex_1.default)(mySQLLocalConfig);
                console.log(environment_1.NODE_ENV === "production" ? mySQLRemoteConfig : mySQLLocalConfig);
                const response = yield mySQLClient.select("*").from("producto").limit(1);
                // Asegurar columnas de descuento en tabla producto
                yield this.insertColumnIfNotExists({ tableName: "producto", columnName: "con_descuento", columnType: "BOOLEAN DEFAULT FALSE" });
                yield this.insertColumnIfNotExists({ tableName: "producto", columnName: "porcentaje_descuento", columnType: "DECIMAL(5,2) DEFAULT 0" });
                yield this.insertColumnIfNotExists({ tableName: "producto", columnName: "precio_full", columnType: "DECIMAL(10,2) DEFAULT 0" });
                return ({ success: true, message: `Conexión a la base de datos exitosa --- ${response[0].nombre} --- Entorno: ${environment_1.NODE_ENV || "Desarrollo"}` });
            }
            catch (err) {
                const message = err instanceof Error ? "Error de conexión a la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, message: message };
            }
        });
        this.getProductsFiltered = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const query = mySQLClient
                    .select(options.fields).from("producto")
                    .where(options.condition.field, options.condition.operator, options.condition.value);
                if (options.searchWords && options.searchWords.length) {
                    query.andWhere(function () {
                        options.searchWords.forEach((word) => {
                            this.andWhere(function () {
                                this.orWhere(mySQLClient.raw("LOWER(nombre)"), "like", `%${word.toLowerCase()}%`)
                                    .orWhere(mySQLClient.raw("LOWER(codigo)"), "like", `%${word.toLowerCase()}%`);
                            });
                        });
                    });
                }
                if (options.categories && options.categories.length) {
                    query.whereIn("categoria", options.categories);
                }
                if (options.priceRange && (0, validations_1.validatePriceRange)(options.priceRange)) {
                    query.whereBetween("precio", options.priceRange);
                }
                if (options.brand) {
                    query.where("marca", options.brand);
                }
                switch (options.orderBy) {
                    case "alphabetic":
                        query.orderByRaw("LOWER(nombre) asc");
                        break;
                    case "date":
                        query.orderBy("fecha_alta", "desc");
                        break;
                    case "price_asc":
                        query.orderBy("precio", "asc");
                        break;
                    case "price_desc":
                        query.orderBy("precio", "desc");
                        break;
                    case "random":
                        query.orderByRaw("RAND()");
                        break;
                    case "default":
                        query.orderBy("order", "asc");
                        break;
                }
                if (options.limit && options.limit !== Infinity) { //Si viene el valor "Infinity" en options.limit NO ponemos limite
                    query.limit(options.limit); //Si no viene ningun valor en options.limit NO poneos limite
                }
                if (typeof options.offset === "number") {
                    query.offset(options.offset);
                }
                const productosDB = yield query;
                return { success: true, data: productosDB, message: "" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al obtener datos de productos de la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.getProductsFilteredRowsQuantity = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const query = mySQLClient("producto")
                    .where(options.condition.field, options.condition.operator, options.condition.value)
                    .andWhere(function () {
                    options.searchWords.forEach((word) => {
                        this.andWhere(function () {
                            this.orWhere(mySQLClient.raw("LOWER(nombre)"), "like", `%${word.toLowerCase()}%`)
                                .orWhere(mySQLClient.raw("LOWER(codigo)"), "like", `%${word.toLowerCase()}%`);
                        });
                    });
                });
                if (options.categories && options.categories.length) {
                    query.whereIn("categoria", options.categories);
                }
                if (options.priceRange && (0, validations_1.validatePriceRange)(options.priceRange)) {
                    query.whereBetween("precio", options.priceRange);
                }
                if (options.brand) {
                    query.where("marca", options.brand);
                }
                const numberOfRows = yield query
                    .count();
                return { success: true, data: numberOfRows[0]["count(*)"], message: "" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al obtener el número de filas de la tabla de productos en la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.getTable = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const query = mySQLClient(options.tableName);
                if (!options.count) {
                    if (options.fields && (0, utils_1.isValidNoEmptyArray)(options.fields)) { //Si no se especifican los campos se devuelven todos
                        query.select(options.fields);
                    }
                }
                else {
                    query.select(["id"]);
                }
                if (options.conditions && options.conditions.length) {
                    options.conditions.forEach((condition) => {
                        query.where(condition.field, condition.value);
                    });
                }
                if (options.limit && options.limit !== Infinity) { //Si viene el valor "Infinity" en options.limit NO ponemos limite
                    query.limit(options.limit); //Si no viene ningun valor en options.limit NO poneos limite
                }
                if (typeof options.offset === "number") {
                    query.offset(options.offset);
                }
                if (options.orderBy) {
                    query.orderBy(options.orderBy.field, options.orderBy.order);
                }
                const table = yield query;
                return options.count ? { success: true, data: table.length, message: "" } : { success: true, data: table, message: "" };
            }
            catch (err) {
                const message = err instanceof Error ? `Error al obtener tabla "${options.tableName}" de la base de datos: ` + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.getProductByID = (productID) => __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield mySQLClient.from("producto").where("id", productID);
                return { success: true, data: product, message: "" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al obtener datos de producto de la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.getProductsByIDs = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const productsArr = yield mySQLClient.select(options.fieldsArr).from("producto").whereIn("id", options.productsIDsArr);
                return { success: true, data: productsArr, message: "" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al obtener datos de productos de la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.updateTable = (options) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            const transaction = yield mySQLClient.transaction();
            try {
                if (options.tableName === "producto") {
                    // If updating product order, handle order switching
                    if (options.data.order !== undefined) {
                        const productId = (_a = options.conditions.find(condition => condition.field === "id")) === null || _a === void 0 ? void 0 : _a.value;
                        if (productId) {
                            yield this.handleProductOrderSwitch(transaction, productId, options.data.order);
                        }
                    }
                }
                let query = transaction(options.tableName).update(options.data);
                options.conditions.forEach(condition => {
                    query = query.where(condition.field, condition.value);
                });
                const numberOfRowsUpdated = yield query;
                yield transaction.commit();
                return { success: true, data: numberOfRowsUpdated, message: "Datos actualizados con éxito" };
            }
            catch (err) {
                yield transaction.rollback(); // Rollback de la transacción en caso de error
                const message = err instanceof Error ? `Error al actualizar datos: ${options.tableName} - ` + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.handleProductOrderSwitch = (transaction, productId, newOrder) => __awaiter(this, void 0, void 0, function* () {
            // Get current product order
            const currentProduct = yield transaction("producto").where("id", productId).select("order").first();
            if (!currentProduct) {
                throw new Error(`Product with ID ${productId} not found`);
            }
            const currentOrder = currentProduct.order;
            if (currentOrder === newOrder) {
                return;
            }
            if (currentOrder > newOrder) {
                // Si el orden actual es mayor al nuevo orden, mover productos hacia arriba
                // Incrementar en +1 el orden de todos los productos desde newOrder hasta currentOrder-1
                yield transaction("producto")
                    .where("order", ">=", newOrder)
                    .where("order", "<", currentOrder)
                    .where("id", "!=", productId)
                    .increment("order", 1);
                console.log(`Products with order >= ${newOrder} and < ${currentOrder} incremented by 1`);
            }
            else {
                // Si el orden actual es menor al nuevo orden, mover productos hacia abajo  
                // Decrementar en -1 el orden de todos los productos desde currentOrder+1 hasta newOrder
                yield transaction("producto")
                    .where("order", ">", currentOrder)
                    .where("order", "<=", newOrder)
                    .where("id", "!=", productId)
                    .decrement("order", 1);
                console.log(`Products with order > ${currentOrder} and <= ${newOrder} decremented by 1`);
            }
            console.log(`Product ${productId} will get new order ${newOrder} (was ${currentOrder})`);
        });
        this.handleProductOrderOnInsert = (transaction, newOrder) => __awaiter(this, void 0, void 0, function* () {
            if (newOrder === 1) {
                // Si el order = 1, mover el orden de TODOS los demás productos (incrementar en +1)
                yield transaction("producto")
                    .increment("order", 1);
                console.log("All existing products order incremented by 1 due to new product with order = 1");
            }
            else {
                // Si el order ≠ 1, mover solo los productos afectados (los que tienen orden >= al nuevo orden)
                yield transaction("producto")
                    .where("order", ">=", newOrder)
                    .increment("order", 1);
                console.log(`Products with order >= ${newOrder} incremented by 1`);
            }
        });
        this.handleProductOrderOnDelete = (transaction, deletedProductOrder) => __awaiter(this, void 0, void 0, function* () {
            // Cuando se elimina un producto, todos los productos con orden mayor al eliminado
            // deben decrementar su orden en -1 para llenar el hueco dejado
            yield transaction("producto")
                .where("order", ">", deletedProductOrder)
                .decrement("order", 1);
            console.log(`Products with order > ${deletedProductOrder} decremented by 1 due to product deletion`);
        });
        /** Transaccion para cuando tenemos que insertar varias filas (una para cada producto del carrito) al generar un pedido**/
        this.insertRow = (options) => __awaiter(this, void 0, void 0, function* () {
            const trx = yield mySQLClient.transaction(); // Inicia la transacción
            try {
                // Si estamos insertando un producto, manejar el orden
                if (options.tableName === "producto") {
                    if (!options.data.order) {
                        options.data.order = 1;
                    }
                    yield this.handleProductOrderOnInsert(trx, options.data.order);
                }
                // Si estamos insertando una marca, establecer fecha si no está presente
                if (options.tableName === "marca" && !options.data.fecha) {
                    options.data.fecha = (0, utils_1.getCurrentDateTime)();
                }
                const newRowsIDsArr = yield trx(options.tableName).insert(options.data, "id"); // Realiza la inserción dentro de la transacción
                yield trx.commit(); // Confirma la transacción
                return { success: true, data: newRowsIDsArr, message: "Datos agregados correctamente" };
            }
            catch (err) {
                yield trx.rollback(); // Deshace la transacción en caso de error
                const message = err instanceof Error
                    ? `Error al insertar fila en tabla: ${options.tableName}: ` + err.message
                    : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.deleteRowById = (options) => __awaiter(this, void 0, void 0, function* () {
            const transaction = yield mySQLClient.transaction();
            try {
                // Si estamos eliminando un producto, necesitamos obtener su orden antes de eliminarlo
                if (options.tableName === "producto") {
                    const productToDelete = yield transaction("producto")
                        .where("id", options.rowID)
                        .select("order")
                        .first();
                    if (productToDelete) {
                        const deletedProductOrder = productToDelete.order;
                        // Eliminar el producto
                        const response = yield transaction(options.tableName).where("id", options.rowID).del();
                        // Reordenar los productos restantes
                        yield this.handleProductOrderOnDelete(transaction, deletedProductOrder);
                        yield transaction.commit();
                        return { success: true, data: response, message: "Producto eliminado y orden reajustado correctamente" };
                    }
                    else {
                        yield transaction.rollback();
                        return { success: false, data: null, message: "Producto no encontrado" };
                    }
                }
                else {
                    // Para otras tablas, eliminar normalmente sin transacción
                    yield transaction.rollback(); // Cancelar la transacción ya que no la necesitamos
                    const response = yield mySQLClient(options.tableName).where("id", options.rowID).del();
                    return { success: true, data: response, message: "Datos eliminados correctamente" };
                }
            }
            catch (err) {
                yield transaction.rollback();
                const message = err instanceof Error ? `Error al eliminar datos de la tabla: ${options.tableName}` + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.deleteRows = (options) => __awaiter(this, void 0, void 0, function* () {
            const { tableName, conditions } = options;
            const trx = yield mySQLClient.transaction();
            try {
                // Si estamos eliminando productos, necesitamos obtener los órdenes antes de eliminarlos
                if (tableName === "producto") {
                    // Obtener los órdenes de los productos que se van a eliminar
                    const productsToDelete = yield trx("producto")
                        .where(function () {
                        conditions.forEach((condition) => {
                            this.where(condition.field, condition.value);
                        });
                    })
                        .select("order")
                        .orderBy("order", "asc"); // Ordenamos para procesar de menor a mayor
                    if (productsToDelete.length === 0) {
                        yield trx.commit();
                        return { success: true, data: 0, message: "No se encontraron productos para eliminar" };
                    }
                    const deletedOrders = productsToDelete.map(p => p.order).sort((a, b) => a - b);
                    // Eliminar los productos
                    const rowsDeletedQuantity = yield trx(tableName)
                        .where(function () {
                        conditions.forEach((condition) => {
                            this.where(condition.field, condition.value);
                        });
                    })
                        .del();
                    // Reordenar los productos restantes
                    // Para cada orden eliminado, decrementar todos los productos con orden mayor
                    for (let i = 0; i < deletedOrders.length; i++) {
                        const deletedOrder = deletedOrders[i];
                        // Ajustar el orden considerando las eliminaciones previas
                        const adjustedOrder = deletedOrder - i;
                        yield trx("producto")
                            .where("order", ">", adjustedOrder)
                            .decrement("order", 1);
                        console.log(`Products with order > ${adjustedOrder} decremented by 1 due to product deletion (batch ${i + 1}/${deletedOrders.length})`);
                    }
                    yield trx.commit();
                    return { success: true, data: rowsDeletedQuantity, message: `${rowsDeletedQuantity} productos eliminados y orden reajustado correctamente` };
                }
                else {
                    // Para otras tablas, eliminar normalmente
                    const query = mySQLClient(tableName)
                        .where(function () {
                        conditions.forEach((condition) => {
                            this.where(condition.field, condition.value);
                        });
                    })
                        .del()
                        .transacting(trx);
                    const rowsDeletedQuantity = yield query;
                    yield trx.commit();
                    if (rowsDeletedQuantity) {
                        return { success: true, data: rowsDeletedQuantity, message: "Filas eliminadas correctamente" };
                    }
                    else {
                        return { success: true, data: rowsDeletedQuantity, message: "No se encontraron filas para eliminar" };
                    }
                }
            }
            catch (err) {
                yield trx.rollback(); // Si ocurre un error, revierte la transacción
                const message = err instanceof Error ? `Error al eliminar filas. Se realizado un rollBack: ${options.tableName}` + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.createCartsTableIfNotExits = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const existTable = yield mySQLClient.schema.hasTable("carts");
                if (!existTable) {
                    yield mySQLClient.schema.createTable("carts", function (table) {
                        table.increments("id").primary(); // ID autoincremental
                        table.string("userEmail", 255).notNullable(); // Email del usuario
                        table.json("cart"); // Columna JSON para el carrito
                        table.text("generalObservation", "longtext"); // Observación larga
                        table.bigInteger("lastDate"); // Fecha como BIGINT (timestamp en milisegundos)
                        table.bigInteger("cronJobId"); // ID de cron job como BIGINT
                    });
                    return { success: true, data: true, message: "Tabla de carritos (carts) creada correctamente" };
                }
                else {
                    return { success: true, data: false, message: "" };
                }
            }
            catch (err) {
                const message = err instanceof Error ? "Error al crear tabla de carritos (carts) " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.getCart = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield mySQLClient("carts").where("userEmail", options.userEmail);
                return { success: true, data: response, message: "Carrito obtenido correctamente" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al obtener carrito de la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.saveCart = (data) => __awaiter(this, void 0, void 0, function* () {
            const { cartData, userEmail } = data;
            try {
                const cartExists = yield mySQLClient("carts").where("userEmail", userEmail).select("id");
                if (cartExists.length) {
                    const response = yield mySQLClient("carts").where("userEmail", userEmail).update({ cart: JSON.stringify(cartData.cartItems), lastDate: Date.now(), generalObservation: cartData.generalObservation || "" });
                    return { success: true, data: response, message: "Carrito actualizado correctamente" };
                }
                else {
                    const response = yield mySQLClient("carts").insert({ userEmail: userEmail, cart: JSON.stringify(cartData.cartItems), lastDate: Date.now(), generalObservation: cartData.generalObservation || "" });
                    return { success: true, data: response, message: "Carrito guardado correctame" };
                }
            }
            catch (err) {
                const message = err instanceof Error ? "Error al guardar el carrito en la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.updateCart = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const numberOfRowsUpdated = yield mySQLClient("carts").update(options.data).where(options.condition.field, options.condition.value);
                return { success: true, data: numberOfRowsUpdated, message: "Carrito actualizado con éxito" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al actualizar datos de carrito" + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        // updateProductsOrder = async (options: { newProductsOrderArr: NewProductsOrderArr }) => {
        //     const {newProductsOrderArr} = options;
        //     try {
        //         await mySQLClient.transaction(async trx => {
        //             for (const product of newProductsOrderArr) {
        //                 await trx("producto")
        //                     .where("id", product.id)
        //                     .update({ order: product.order });
        //             }
        //         });
        //         return {success: true, data: null, message: "Orden de productos actualizado correctamente"};
        //     } catch (err) {
        //         const message = err instanceof Error ? "Error al actualizar orden de productos" + err.message : "ERROR: " + err;
        //         return {success: false, data: null, message: message};
        //     }
        // };
        //Optimizamos la función anterior usando una sola operación update en lugar de un ciclo for para cada fila. Utilizar un update con una estructura CASE y WHEN 
        // permite actualizar múltiples filas en una sola consulta SQL, lo cual es mucho más eficiente en términos de rendimiento. 
        this.updateProductsOrder = (options) => __awaiter(this, void 0, void 0, function* () {
            const { newProductsOrderArr } = options;
            try {
                yield mySQLClient.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
                    // Crear un mapa de ids y sus nuevos valores de orden
                    const ids = newProductsOrderArr.map(product => product.id);
                    console.log("ids", ids);
                    const orderCases = newProductsOrderArr.reduce((cases, product) => {
                        return cases.concat(`WHEN id = ${product.id} THEN ${product.order} `);
                    }, "");
                    // Generar una consulta SQL para actualizar todos los productos
                    yield trx.raw(`
                    UPDATE producto
                    SET \`order\` = CASE ${orderCases} END
                    WHERE id IN (${ids.join(", ")});
                `);
                }));
                return { success: true, data: null, message: "Orden de productos actualizado correctamente" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al actualizar orden de productos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.insertColumnIfNotExists = (options) => __awaiter(this, void 0, void 0, function* () {
            const { tableName, columnName, columnType } = options;
            const [result] = yield mySQLClient.raw(`                                               
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}';
        `);
            if (result.length === 0) { /*NULL al final permite que el valor de la columna pueda ser nulo (no obligatorio) */
                yield mySQLClient.raw(`
                ALTER TABLE ${tableName} 
                ADD COLUMN ${columnName} ${columnType.toUpperCase()} NULL;                                                     
            `);
            }
        });
        this.createUsersLogTableIfNotExits = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const existTable = yield mySQLClient.schema.hasTable("log");
                if (!existTable) {
                    yield mySQLClient.schema.createTable("log", function (table) {
                        table.bigIncrements("id").primary(); // id BIGINT AUTO_INCREMENT PRIMARY KEY
                        table.string("email", 255).notNullable(); // email VARCHAR(255) NOT NULL
                        table.string("password", 255).notNullable(); // password VARCHAR(255) NOT NULL
                        table.string("clave", 255).notNullable(); // clave VARCHAR(255) NOT NULL
                        table.bigint("id_usuario").notNullable(); // id_usuario BIGINT NOT NULL
                        table.enu("ingreso", ["ok", "error"]).notNullable(); // ingreso ENUM('ok', 'error') NOT NULL
                        table.string("ip", 45).notNullable(); // ip VARCHAR(45) NOT NULL
                        table.datetime("date").notNullable(); // date DATETIME NOT NULL
                        table.bigint("time").notNullable(); // time BIGINT NOT NULL
                        table.string("device", 255).notNullable(); // device VARCHAR(255) NOT NULL
                        table.text("device_info").notNullable(); // device_info TEXT NOT NULL
                    });
                    return { success: true, data: true, message: "Tabla de log de usuarios creada correctamente" };
                }
                else {
                    return { success: true, data: false, message: "" };
                }
            }
            catch (err) {
                const message = err instanceof Error ? "Error al crear tabla de logs de usuarios" + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.createProductsHabDesTableLogs = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const existTable = yield mySQLClient.schema.hasTable("habdeslog");
                if (!existTable) {
                    yield mySQLClient.schema.createTable("habdeslog", function (table) {
                        table.bigIncrements("id").primary(); // id BIGINT AUTO_INCREMENT PRIMARY KEY
                        table.bigint("timestamp").notNullable(); // timestamp BIGINT NOT NULL
                        table.bigint("id_producto").notNullable(); // id_usuario BIGINT NOT NULL
                        table.enum("prevstate", ["0", "1"]).notNullable();
                        table.enum("newstate", ["0", "1"]).notNullable();
                    });
                    return { success: true, data: true, message: "Tabla de logs de habilitación / deshabilitación automática creada correctamente" };
                }
                else {
                    return { success: true, data: false, message: "" };
                }
            }
            catch (err) {
                const message = err instanceof Error ? "Error al crear tabla de logs de habilitación / deshabilitación automática" + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.getLastRowForUser = (ip) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield mySQLClient("log").where("ip", ip).orderBy("id", "desc").first();
                return { success: true, data: response, message: "Último log de usuario obtenido correctamente" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al obtener último log de usuario" + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.createNotificationsLogTableIfNotExits = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const existTable = yield mySQLClient.schema.hasTable("log_envio");
                if (!existTable) {
                    yield mySQLClient.schema.createTable("log_envio", function (table) {
                        table.bigIncrements("id").primary(); // id BIGINT AUTO_INCREMENT PRIMARY KEY
                        table.string("notificationType", 255).notNullable(); // notificationType VARCHAR(255) NOT NULL
                        table.string("recipients", 255).notNullable(); // recipients VARCHAR(255) NOT NULL
                        table.bigint("timestamp").notNullable(); // timestamp BIGINT NOT NULL
                    });
                    return { success: true, data: true, message: "Tabla de logs de envíos creada correctamente" };
                }
                else {
                    return { success: true, data: false, message: "" };
                }
            }
            catch (err) {
                const message = err instanceof Error ? "Error al crear tabla de logs de envíos" + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.inserNotificationLog = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield mySQLClient("log_envio").insert({ notificationType: options.notificationType, recipients: options.recipients, timestamp: Date.now() });
                return { success: true, data: response, message: "Log de envío insertado correctamente" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al insertar log de envío" + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
        this.syncProducts = (data) => __awaiter(this, void 0, void 0, function* () {
            const transaction = yield mySQLClient.transaction();
            try {
                const promises = data.map((item) => transaction("producto").update(item).where("codigo", item.codigo));
                yield Promise.all(promises);
                yield transaction.commit();
                return { success: true, message: "Datos sincronizados con éxito" };
            }
            catch (err) {
                yield transaction.rollback(); // Rollback en caso de error
                const message = err instanceof Error ? `Error al sincronizar tabla de productos: ${err.message}` : "ERROR: " + err;
                return { success: false, message: message };
            }
        });
        this.getProductsByCodesArr = (options) => __awaiter(this, void 0, void 0, function* () {
            try {
                const productsArr = yield mySQLClient.select(options.fieldsArr).from("producto").whereIn("codigo", options.productsCodesArr);
                return { success: true, data: productsArr, message: "" };
            }
            catch (err) {
                const message = err instanceof Error ? "Error al obtener datos de productos de la base de datos: " + err.message : "ERROR: " + err;
                return { success: false, data: null, message: message };
            }
        });
    }
}
exports.mySQLActions = mySQLActions;
//# sourceMappingURL=mySQLActions.js.map