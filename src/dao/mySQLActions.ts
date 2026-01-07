import knex, { Knex } from "knex";
import { mySQL_LocalConfig, mySQL_RemoteConfig, NODE_ENV } from "../environment";
import { ProductDataForSync } from "../types/misc";
import { CartDataForDBFromAPI, CartDataForDBFromFront, FilterOrderByTypes, MySQLActions_CustomResponse, NewProductsOrderArr, NotificationType } from "../types/types";
import { getCurrentDateTime, isValidNoEmptyArray } from "../utils/utils";
import { validatePriceRange } from "../validations";

const mySQLLocalConfig = {
    client: "mysql2",
    connection: {
        host: mySQL_LocalConfig.host,
        user: mySQL_LocalConfig.user,
        password: mySQL_LocalConfig.password,
        database: mySQL_LocalConfig.databaseName,
        ssl: mySQL_LocalConfig.ssl,
        port: mySQL_LocalConfig.port,
    }
};

const mySQLRemoteConfig = {
    client: "mysql2",
    connection: {
        host: mySQL_RemoteConfig.host,
        user: mySQL_RemoteConfig.user,
        password: mySQL_RemoteConfig.password,
        database: mySQL_RemoteConfig.databaseName,
        ssl: mySQL_RemoteConfig.ssl,
        port: mySQL_RemoteConfig.port,
    }
};

let mySQLClient: Knex;

export class mySQLActions {

    connect = async () => {                                                                     //EN AIVEN (console.aiven.io) configurar -> Users -> Edit authentication -> "MYSQL native password" (sino knex no se conecta)
        try {
            mySQLClient = NODE_ENV === "production" ? knex(mySQLRemoteConfig) : knex(mySQLLocalConfig);
            console.log(NODE_ENV === "production" ? mySQLRemoteConfig : mySQLLocalConfig);
            const response = await mySQLClient.select("*").from("producto").limit(1);
            return ({success: true , message: `Conexión a la base de datos exitosa --- ${response[0].nombre} --- Entorno: ${NODE_ENV || "Desarrollo"}`});
        } catch (err) {
            const message = err instanceof Error ? "Error de conexión a la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, message: message};
        }
    };

    getProductsFiltered = async (options:{limit: number, offset: number, fields: string[], condition: {field: any, operator: any, value: any}, searchWords: string[], categories: number[], priceRange: [number, number], orderBy: FilterOrderByTypes, brand: number | null}) : Promise <MySQLActions_CustomResponse> => {
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

            if (options.priceRange && validatePriceRange(options.priceRange)) {
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
            
            if (options.limit && options.limit !== Infinity) {                                                                       //Si viene el valor "Infinity" en options.limit NO ponemos limite
                query.limit(options.limit);                                                                                          //Si no viene ningun valor en options.limit NO poneos limite
            }
            
            if (typeof options.offset === "number") {
                query.offset(options.offset);
            }  

            const productosDB = await query;
      
            return {success: true, data: productosDB, message: ""};
        } catch (err) {
            const message = err instanceof Error ? "Error al obtener datos de productos de la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    getProductsFilteredRowsQuantity = async (options: {condition: {field: any, operator: any, value: any}, searchWords: string[], categories: number[], priceRange: [number, number], brand: number | null}) : Promise <MySQLActions_CustomResponse>  => {
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

            if (options.priceRange && validatePriceRange(options.priceRange)) {
                query.whereBetween("precio", options.priceRange);
            }

            if (options.brand) {
                query.where("marca", options.brand);
            }

            const numberOfRows = await query
                .count();

            return {success: true, data: numberOfRows[0]["count(*)"], message: ""};
        } catch (err) {
            const message = err instanceof Error ? "Error al obtener el número de filas de la tabla de productos en la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    getTable = async (options: {
        tableName: string, 
        fields?: string[], 
        conditions?: {field: string, value: string | number}[], 
        limit?: number,
        offset?: number,
        count?: boolean
        orderBy?: {field: string, order: "asc" | "desc"}
    }) : Promise <MySQLActions_CustomResponse> => {
        try {
            const query = mySQLClient(options.tableName);

            if (!options.count) {
                if (options.fields && isValidNoEmptyArray(options.fields)) {                                                         //Si no se especifican los campos se devuelven todos
                    query.select(options.fields);
                } 
            } else {
                query.select(["id"]);
            }

            if (options.conditions && options.conditions.length) {
                options.conditions.forEach((condition) => {
                    query.where(condition.field, condition.value);
                });
            }

            if (options.limit && options.limit !== Infinity) {                                                                       //Si viene el valor "Infinity" en options.limit NO ponemos limite
                query.limit(options.limit);                                                                                          //Si no viene ningun valor en options.limit NO poneos limite
            }

            if (typeof options.offset === "number") {
                query.offset(options.offset);
            }   

            if (options.orderBy) {
                query.orderBy(options.orderBy.field, options.orderBy.order);
            }
  
            const table = await query;
            return options.count ? {success: true, data: table.length , message: ""} : {success: true, data: table, message: ""};

        } catch (err) {
            const message = err instanceof Error ? `Error al obtener tabla "${options.tableName}" de la base de datos: ` + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    getProductByID = async (productID: number) : Promise <MySQLActions_CustomResponse> => {
        try {
            const product = await mySQLClient.from("producto").where("id", productID);
            return {success: true, data: product, message: ""};
        } catch (err) {
            const message = err instanceof Error ? "Error al obtener datos de producto de la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    getProductsByIDs = async (options: {productsIDsArr: number[], fieldsArr: string[]}) : Promise <MySQLActions_CustomResponse> => {
        try {
            const productsArr = await mySQLClient.select(options.fieldsArr).from("producto").whereIn("id", options.productsIDsArr);
            return {success: true, data: productsArr, message: ""};
        } catch (err) {
            const message = err instanceof Error ? "Error al obtener datos de productos de la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    updateTable = async (options: {tableName: string, conditions: {field: string, value: string | number}[], data: any}) => {
        const transaction = await mySQLClient.transaction(); 
        try {

            if(options.tableName === "producto") {                
                // If updating product order, handle order switching
                if (options.data.order !== undefined) {
                    const productId = options.conditions.find(condition => condition.field === "id")?.value;
                    if (productId) {
                        await this.handleProductOrderSwitch(transaction, productId as number, options.data.order);
                    }
                }
            }
            let query = transaction(options.tableName).update(options.data);
            options.conditions.forEach(condition => {
                query = query.where(condition.field, condition.value);
            });
            const numberOfRowsUpdated = await query;
            await transaction.commit();
    
            return {success: true, data: numberOfRowsUpdated, message: "Datos actualizados con éxito"};
        } catch (err) {
            await transaction.rollback();                                                                        // Rollback de la transacción en caso de error
            const message = err instanceof Error ? `Error al actualizar datos: ${options.tableName} - ` + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    private handleProductOrderSwitch = async (transaction: any, productId: number, newOrder: number) => {
        // Get current product order
        const currentProduct = await transaction("producto").where("id", productId).select("order").first();
        
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
            await transaction("producto")
                .where("order", ">=", newOrder)
                .where("order", "<", currentOrder)
                .where("id", "!=", productId)
                .increment("order", 1);
                
            console.log(`Products with order >= ${newOrder} and < ${currentOrder} incremented by 1`);
        } else {
            // Si el orden actual es menor al nuevo orden, mover productos hacia abajo  
            // Decrementar en -1 el orden de todos los productos desde currentOrder+1 hasta newOrder
            await transaction("producto")
                .where("order", ">", currentOrder)
                .where("order", "<=", newOrder)
                .where("id", "!=", productId)
                .decrement("order", 1);
                
            console.log(`Products with order > ${currentOrder} and <= ${newOrder} decremented by 1`);
        }

        console.log(`Product ${productId} will get new order ${newOrder} (was ${currentOrder})`);
    };

    private handleProductOrderOnInsert = async (transaction: any, newOrder: number) => {
        if (newOrder === 1) {
            // Si el order = 1, mover el orden de TODOS los demás productos (incrementar en +1)
            await transaction("producto")
                .increment("order", 1);
                
            console.log("All existing products order incremented by 1 due to new product with order = 1");
        } else {
            // Si el order ≠ 1, mover solo los productos afectados (los que tienen orden >= al nuevo orden)
            await transaction("producto")
                .where("order", ">=", newOrder)
                .increment("order", 1);
                
            console.log(`Products with order >= ${newOrder} incremented by 1`);
        }
    };

    private handleProductOrderOnDelete = async (transaction: any, deletedProductOrder: number) => {
        // Cuando se elimina un producto, todos los productos con orden mayor al eliminado
        // deben decrementar su orden en -1 para llenar el hueco dejado
        await transaction("producto")
            .where("order", ">", deletedProductOrder)
            .decrement("order", 1);
            
        console.log(`Products with order > ${deletedProductOrder} decremented by 1 due to product deletion`);
    };
           

    /** Transaccion para cuando tenemos que insertar varias filas (una para cada producto del carrito) al generar un pedido**/
    insertRow = async (options: {tableName: string, data: any}) => {                                            //También pueden insertarse varias filas si le pasamos un array de filas a "data". En ese caso la funcion devuelve un array de ID's de filas creadas
        const trx = await mySQLClient.transaction();                                                            // Inicia la transacción
        try {
            // Si estamos insertando un producto, manejar el orden
            if (options.tableName === "producto") {
                if (!options.data.order) {
                    options.data.order = 1;
                }
                
                await this.handleProductOrderOnInsert(trx, options.data.order);
            }
            
            // Si estamos insertando una marca, establecer fecha si no está presente
            if (options.tableName === "marca" && !options.data.fecha) {
                options.data.fecha = getCurrentDateTime();
            }
            
            const newRowsIDsArr = await trx(options.tableName).insert(options.data, "id");                      // Realiza la inserción dentro de la transacción
            await trx.commit();                                                                                 // Confirma la transacción
            return {success: true, data: newRowsIDsArr, message: "Datos agregados correctamente"};
        } catch (err) {
            await trx.rollback();                                                                               // Deshace la transacción en caso de error
            const message = err instanceof Error 
                ? `Error al insertar fila en tabla: ${options.tableName}: ` + err.message 
                : "ERROR: " + err;
            
            return {success: false, data: null, message: message};
        }
    };

    deleteRowById = async (options: {tableName: string, rowID: number}) => {
        const transaction = await mySQLClient.transaction();
        try {
            // Si estamos eliminando un producto, necesitamos obtener su orden antes de eliminarlo
            if (options.tableName === "producto") {
                const productToDelete = await transaction("producto")
                    .where("id", options.rowID)
                    .select("order")
                    .first();
                
                if (productToDelete) {
                    const deletedProductOrder = productToDelete.order;
                    
                    // Eliminar el producto
                    const response = await transaction(options.tableName).where("id", options.rowID).del();
                    
                    // Reordenar los productos restantes
                    await this.handleProductOrderOnDelete(transaction, deletedProductOrder);
                    
                    await transaction.commit();
                    return {success: true, data: response, message: "Producto eliminado y orden reajustado correctamente"};
                } else {
                    await transaction.rollback();
                    return {success: false, data: null, message: "Producto no encontrado"};
                }
            } else {
                // Para otras tablas, eliminar normalmente sin transacción
                await transaction.rollback(); // Cancelar la transacción ya que no la necesitamos
                const response = await mySQLClient(options.tableName).where("id", options.rowID).del();
                return {success: true, data: response, message: "Datos eliminados correctamente"};
            }
        } catch (err) {
            await transaction.rollback();
            const message = err instanceof Error ? `Error al eliminar datos de la tabla: ${options.tableName}` + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    deleteRows = async (options: { tableName: string, conditions: { field: string, value: string | number }[] }): Promise <MySQLActions_CustomResponse> => {
        const { tableName, conditions } = options;
        const trx = await mySQLClient.transaction();
        try {
            // Si estamos eliminando productos, necesitamos obtener los órdenes antes de eliminarlos
            if (tableName === "producto") {
                // Obtener los órdenes de los productos que se van a eliminar
                const productsToDelete = await trx("producto")
                    .where(function () {
                        conditions.forEach((condition) => {
                            this.where(condition.field, condition.value);
                        });
                    })
                    .select("order")
                    .orderBy("order", "asc"); // Ordenamos para procesar de menor a mayor
                
                if (productsToDelete.length === 0) {
                    await trx.commit();
                    return {success: true, data: 0, message: "No se encontraron productos para eliminar"};
                }

                const deletedOrders = productsToDelete.map(p => p.order).sort((a, b) => a - b);
                
                // Eliminar los productos
                const rowsDeletedQuantity = await trx(tableName)
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
                    
                    await trx("producto")
                        .where("order", ">", adjustedOrder)
                        .decrement("order", 1);
                        
                    console.log(`Products with order > ${adjustedOrder} decremented by 1 due to product deletion (batch ${i + 1}/${deletedOrders.length})`);
                }

                await trx.commit();
                return {success: true, data: rowsDeletedQuantity, message: `${rowsDeletedQuantity} productos eliminados y orden reajustado correctamente`};
            } else {
                // Para otras tablas, eliminar normalmente
                const query = mySQLClient(tableName)
                    .where(function () {
                        conditions.forEach((condition) => {
                            this.where(condition.field, condition.value); 
                        });
                    })
                    .del()
                    .transacting(trx);
                const rowsDeletedQuantity = await query;
                await trx.commit();
                if (rowsDeletedQuantity) {
                    return {success: true, data: rowsDeletedQuantity, message: "Filas eliminadas correctamente"};
                } else {
                    return {success: true, data: rowsDeletedQuantity, message: "No se encontraron filas para eliminar"};
                }
            }
        } catch (err) {
            await trx.rollback();                                                                               // Si ocurre un error, revierte la transacción
            const message = err instanceof Error ? `Error al eliminar filas. Se realizado un rollBack: ${options.tableName}` + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    createCartsTableIfNotExits = async () => {
        try {
            const existTable = await mySQLClient.schema.hasTable("carts");
            if (!existTable) {
                await mySQLClient.schema.createTable("carts", function (table) {
                    table.increments("id").primary();                       // ID autoincremental
                    table.string("userEmail", 255).notNullable();           // Email del usuario
                    table.json("cart");                                     // Columna JSON para el carrito
                    table.text("generalObservation", "longtext");           // Observación larga
                    table.bigInteger("lastDate");                           // Fecha como BIGINT (timestamp en milisegundos)
                    table.bigInteger("cronJobId");                          // ID de cron job como BIGINT
                });
                return {success: true, data: true, message: "Tabla de carritos (carts) creada correctamente"};
            } else {
                return {success: true, data: false, message: ""};
            }
        } catch (err) {
            const message = err instanceof Error ? "Error al crear tabla de carritos (carts) " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    getCart = async (options: {userEmail: string}): Promise <MySQLActions_CustomResponse> => {
        try {
            const response = await mySQLClient("carts").where("userEmail", options.userEmail);
            return {success: true, data: response, message: "Carrito obtenido correctamente"};
        } catch (err) {
            const message = err instanceof Error ? "Error al obtener carrito de la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    saveCart = async (data: CartDataForDBFromFront) => {
        const {cartData, userEmail} = data;
        try {
            const cartExists = await mySQLClient("carts").where("userEmail", userEmail).select("id");
            if (cartExists.length) {
                const response = await mySQLClient("carts").where("userEmail", userEmail).update({cart: JSON.stringify(cartData.cartItems), lastDate: Date.now(), generalObservation: cartData.generalObservation || ""});
                return {success: true, data: response, message: "Carrito actualizado correctamente"};
            }  else {
                const response = await mySQLClient("carts").insert({userEmail: userEmail, cart: JSON.stringify(cartData.cartItems), lastDate: Date.now(), generalObservation: cartData.generalObservation || ""});
                return {success: true, data: response, message: "Carrito guardado correctame"};
            }
     
        } catch (err) {
            const message = err instanceof Error ? "Error al guardar el carrito en la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    updateCart = async (options: {condition: {field: string, value: string | number}, data: Partial<CartDataForDBFromAPI>}) => {                    //Actualiza un campo especifico de la tabla "carts", por ejemplo: "cronJobId"
        try {
            const numberOfRowsUpdated = await mySQLClient("carts").update(options.data).where(options.condition.field, options.condition.value);
            return {success: true, data: numberOfRowsUpdated, message: "Carrito actualizado con éxito"};
        } catch (err) {
            const message = err instanceof Error ? "Error al actualizar datos de carrito" + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

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
    updateProductsOrder = async (options: { newProductsOrderArr: NewProductsOrderArr }) => {
        const { newProductsOrderArr } = options;

        try {
            await mySQLClient.transaction(async trx => {
                // Crear un mapa de ids y sus nuevos valores de orden
                const ids = newProductsOrderArr.map(product => product.id);

                console.log("ids", ids);
                const orderCases = newProductsOrderArr.reduce((cases, product) => {         //"orderCases" es un string con todos los casos del CASE WHEN, de forma que para cada ID se le asigne el nuevo orden correspondiente.
                    return cases.concat(`WHEN id = ${product.id} THEN ${product.order} `);
                }, "");

                // Generar una consulta SQL para actualizar todos los productos
                await trx.raw(`
                    UPDATE producto
                    SET \`order\` = CASE ${orderCases} END
                    WHERE id IN (${ids.join(", ")});
                `);
            });

            return { success: true, data: null, message: "Orden de productos actualizado correctamente" };
        } catch (err) {
            const message = err instanceof Error ? "Error al actualizar orden de productos: " + err.message : "ERROR: " + err;
            return { success: false, data: null, message: message };
        }
    };

    insertColumnIfNotExists = async (options: {tableName: string, columnName: string, columnType: string}) => {
        const {tableName, columnName, columnType} = options;
        const [result] = await mySQLClient.raw(`                                               
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '${tableName}' AND COLUMN_NAME = '${columnName}';
        `);
                                                                                                                    
        if (result.length === 0) {                                                                      /*NULL al final permite que el valor de la columna pueda ser nulo (no obligatorio) */
            await mySQLClient.raw(`
                ALTER TABLE ${tableName} 
                ADD COLUMN ${columnName} ${columnType.toUpperCase()} NULL;                                                     
            `);
        }
    };

    createUsersLogTableIfNotExits = async () => {
        try {
            const existTable = await mySQLClient.schema.hasTable("log");
            if (!existTable) {
                await mySQLClient.schema.createTable("log", function (table) {
                    table.bigIncrements("id").primary();                    // id BIGINT AUTO_INCREMENT PRIMARY KEY
                    table.string("email", 255).notNullable();               // email VARCHAR(255) NOT NULL
                    table.string("password", 255).notNullable();            // password VARCHAR(255) NOT NULL
                    table.string("clave", 255).notNullable();               // clave VARCHAR(255) NOT NULL
                    table.bigint("id_usuario").notNullable();               // id_usuario BIGINT NOT NULL
                    table.enu("ingreso", ["ok", "error"]).notNullable();    // ingreso ENUM('ok', 'error') NOT NULL
                    table.string("ip", 45).notNullable();                   // ip VARCHAR(45) NOT NULL
                    table.datetime("date").notNullable();                   // date DATETIME NOT NULL
                    table.bigint("time").notNullable();                     // time BIGINT NOT NULL
                    table.string("device", 255).notNullable();              // device VARCHAR(255) NOT NULL
                    table.text("device_info").notNullable();                // device_info TEXT NOT NULL
                });
                return {success: true, data: true, message: "Tabla de log de usuarios creada correctamente"};
            } else {
                return {success: true, data: false, message: ""};
            }
        } catch (err) {
            const message = err instanceof Error ? "Error al crear tabla de logs de usuarios" + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    createProductsHabDesTableLogs = async () => {
        try {
            const existTable = await mySQLClient.schema.hasTable("habdeslog");
            if (!existTable) {
                await mySQLClient.schema.createTable("habdeslog", function (table) {
                    table.bigIncrements("id").primary();                    // id BIGINT AUTO_INCREMENT PRIMARY KEY
                    table.bigint("timestamp").notNullable();                // timestamp BIGINT NOT NULL
                    table.bigint("id_producto").notNullable();               // id_usuario BIGINT NOT NULL
                    table.enum("prevstate", ["0", "1"]).notNullable();
                    table.enum("newstate", ["0", "1"]).notNullable();
                });
                return {success: true, data: true, message: "Tabla de logs de habilitación / deshabilitación automática creada correctamente"};
            } else {
                return {success: true, data: false, message: ""};
            }
        } catch (err) {
            const message = err instanceof Error ? "Error al crear tabla de logs de habilitación / deshabilitación automática" + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    getLastRowForUser = async (ip: string): Promise <MySQLActions_CustomResponse> => {                                       //Obtiene la ultima fila creada en logs para la ip entrante
        try {
            const response = await mySQLClient("log").where("ip", ip).orderBy("id", "desc").first();
            return {success: true, data: response, message: "Último log de usuario obtenido correctamente"};
        } catch (err) {
            const message = err instanceof Error ? "Error al obtener último log de usuario" + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    createNotificationsLogTableIfNotExits = async () => {
        try {
            const existTable = await mySQLClient.schema.hasTable("log_envio");
            if (!existTable) {
                await mySQLClient.schema.createTable("log_envio", function (table) {
                    table.bigIncrements("id").primary();                    // id BIGINT AUTO_INCREMENT PRIMARY KEY
                    table.string("notificationType", 255).notNullable();    // notificationType VARCHAR(255) NOT NULL
                    table.string("recipients", 255).notNullable();          // recipients VARCHAR(255) NOT NULL
                    table.bigint("timestamp").notNullable();                // timestamp BIGINT NOT NULL
                });
                return {success: true, data: true, message: "Tabla de logs de envíos creada correctamente"};
            } else {
                return {success: true, data: false, message: ""};
            }
        } catch (err) {
            const message = err instanceof Error ? "Error al crear tabla de logs de envíos" + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };

    inserNotificationLog = async (options: {notificationType: NotificationType, recipients: string}) => {
        try {
            const response = await mySQLClient("log_envio").insert({notificationType: options.notificationType, recipients: options.recipients, timestamp: Date.now()});
            return {success: true, data: response, message: "Log de envío insertado correctamente"};
        } catch (err) {
            const message = err instanceof Error ? "Error al insertar log de envío" + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };  

    syncProducts = async (data: ProductDataForSync[]) => {
        const transaction = await mySQLClient.transaction(); 
        try {
            const promises = data.map((item) => transaction("producto").update(item).where("codigo", item.codigo));
            await Promise.all(promises);

            await transaction.commit();
            return { success: true, message: "Datos sincronizados con éxito" };
        } catch (err) {
            await transaction.rollback();                                      // Rollback en caso de error
            const message = err instanceof Error ? `Error al sincronizar tabla de productos: ${err.message}` : "ERROR: " + err;
            return { success: false, message: message };
        }
    };

    getProductsByCodesArr = async (options: {productsCodesArr: string[], fieldsArr: string[]}) : Promise <MySQLActions_CustomResponse> => {
        try {
            const productsArr = await mySQLClient.select(options.fieldsArr).from("producto").whereIn("codigo", options.productsCodesArr);
            return {success: true, data: productsArr, message: ""};
        } catch (err) {
            const message = err instanceof Error ? "Error al obtener datos de productos de la base de datos: " + err.message : "ERROR: " + err;
            return {success: false, data: null, message: message};
        }
    };
}

