import { Request, Response } from "express";
import fs from "fs";
import jwt from "jsonwebtoken";
import path from "path";
import { getDao } from "../dao";
import { tablesForDeleteByAdmins, tablesForDeleteByFrontEnd, tablesForReadByAdmins, tablesForReadByFrontEnd, tablesForWriteByAdmins, tablesForWriteByFrontEnd, userDefaultValues } from "../data/data";
import { BLOG_IMAGES_ROUTE, BLOG_THUMBNAILS_ROUTE, BRANDS_IMAGES_ROUTE, CURRENT_API_BASE_URL, DOCUMENTS_FIREBASE_ROUTE, FAQS_IMAGES_ROUTE, IMAGES_FIREBASE_ROUTE, IMAGES_ROUTE, JWT3_SECRET, THUMBNAILS_FIREBASE_ROUTE, THUMBNAILS_ROUTE } from "../environment";
import { sendMails } from "../services/mails";
import { CustomError } from "../types/customError";
import { CartDataForDBFromFront, DatabaseControllers_CustomResponse, FilterOrderByTypes, Log, Marca, NewProductsOrderArr, Producto, Usuario } from "../types/types";
import { getGlobalMultiplier } from "../utils/database";
import { currentDateForDB, getCurrentDateTime, isValidJSON } from "../utils/utils";
import { validatePriceRange } from "../validations";

export const getProductsFiltered = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || Infinity;                                                             //Si se pone "Infinity" en "limit" trae todos los productos (parseInt(Infinity) => NaN)
        const offset = parseInt(req.query.offset as string) || 0;   
        const orderBy = req.query.orderBy as FilterOrderByTypes;                                                                   //Tambien puede venir "" u otro valos string pero se pone el tipo para que me los reconozca en el switch de la funcion de consulta
        const brand = parseInt(req.query.brand as string) || null; 
        const conditionJSON = req.query.condition as string;
        const conditionOBJ = isValidJSON(conditionJSON) ? JSON.parse(conditionJSON) : {field: true, operator: "=", value: true};    //Si no hay condición muestra todos los productos 
        const fieldsJSON = req.query.fields as string;
        const fieldsOBJ = isValidJSON(fieldsJSON) ? JSON.parse(fieldsJSON) : ["*"];                                                 //Si no se especifican los campos se devuleven todos
        const searchWordsJSON = req.query.searchWords as string;
        const searchWordsOBJ = isValidJSON(searchWordsJSON) ? JSON.parse(searchWordsJSON) : [];
        const categoriesArrJSON = req.query.categories as string;
        const categoriesArrOBJ = isValidJSON(categoriesArrJSON) ? JSON.parse(categoriesArrJSON) : []; 
        const priceRangeArrJSON = req.query.priceRange as string;
        const priceRangeArrOBJ = isValidJSON(priceRangeArrJSON) ? JSON.parse(priceRangeArrJSON) : [];
                                                        
        const globalMultiplier = await getGlobalMultiplier();

        if (validatePriceRange(priceRangeArrOBJ)) {
            priceRangeArrOBJ[0] = priceRangeArrOBJ[0] / globalMultiplier;
            priceRangeArrOBJ[1] = priceRangeArrOBJ[1] / globalMultiplier;
        } else {
            priceRangeArrOBJ.length = 0;      
        }

        const response2 = await getDao().getProductsFiltered({ limit: limit, offset: offset, fields: fieldsOBJ, condition: conditionOBJ, searchWords: searchWordsOBJ, categories: categoriesArrOBJ, priceRange: priceRangeArrOBJ, orderBy: orderBy, brand: brand});
    
        if (response2.success) {
            response2.data.forEach(
                (data: Partial<Producto>) => {
                    if (data.foto1) {
                        if (data.foto1.includes("firebase/")) {
                            const foto1Name = data.foto1.split("firebase/")[1];
                            const encodedFoto1Name = encodeURIComponent(foto1Name);
                            data.foto1 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                            data.thumbnail1 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                            data.foto1NameToDelete = foto1Name;
                        } else {
                            const encodedFoto1Name = encodeURIComponent(data.foto1);
                            data.foto1 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                            data.thumbnail1 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                        }
                    } else {
                        data.foto1 = "";
                        data.thumbnail1 = "";
                    }

                    if (data.foto2) {
                        if (data.foto2.includes("firebase/")) {
                            const foto2Name = data.foto2.split("firebase/")[1];
                            const encodedFoto2Name = encodeURIComponent(foto2Name);
                            data.foto2 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                            data.thumbnail2 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                            data.foto2NameToDelete = foto2Name;
                        } else {
                            const encodedFoto2Name = encodeURIComponent(data.foto2);
                            data.foto2 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                            data.thumbnail2 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                        }
                    } else {
                        data.foto2 = "";
                        data.thumbnail2 = "";
                    }

                    if (data.precio) {
                        data.precioDolar = data.precio;
                    }
                }
            );
            res.status(200).json(response2 as DatabaseControllers_CustomResponse);
        } else {
            res.status(500).json(response2 as DatabaseControllers_CustomResponse);
        }

    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
}; 

export const getProductsFilteredRowsQuantity = async (req: Request, res: Response) => {
    try {
        const brand = parseInt(req.query.brand as string) || null;
        const conditionJSON = req.query.condition as string;
        const conditionOBJ = isValidJSON(conditionJSON) ? JSON.parse(conditionJSON) : {field: true, operator: "=", value: true};                //Si no hay condición muestra todos los productos 
        const searchWordsJSON = req.query.searchWords as string;
        const searchWordsOBJ = isValidJSON(searchWordsJSON) ? JSON.parse(searchWordsJSON) : [];
        const categoriesArrJSON = req.query.categories as string;
        const categoriesArrOBJ = isValidJSON(categoriesArrJSON) ? JSON.parse(categoriesArrJSON) : []; 
        const priceRangeArrJSON = req.query.priceRange as string;
        const priceRangeArrOBJ = isValidJSON(priceRangeArrJSON) ? JSON.parse(priceRangeArrJSON) : [];

        const globalMultiplier = await getGlobalMultiplier();

        if (validatePriceRange(priceRangeArrOBJ)) {
            priceRangeArrOBJ[0] = priceRangeArrOBJ[0] / globalMultiplier;
            priceRangeArrOBJ[1] = priceRangeArrOBJ[1] / globalMultiplier;
        } else {
            priceRangeArrOBJ.length = 0;      
        }
           
        const response = await getDao().getProductsFilteredRowsQuantity({condition: conditionOBJ, searchWords: searchWordsOBJ, categories: categoriesArrOBJ, priceRange: priceRangeArrOBJ, brand: brand});
        if (response.success) {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }

    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
}; 

export const getTable = async (req: Request, res: Response) => {
    try {
        const tableName = req.query.tableName as string;
        if (!tablesForReadByFrontEnd.includes(tableName) && !tablesForReadByAdmins.includes(tableName)) throw new CustomError("Permiso denegado", 401);         //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (tablesForReadByAdmins.includes(tableName) && !req.decoded?.isAdmin) throw new CustomError("Permiso denegado", 401);                                 //Si la tabla requerida está en "tablesForReadByAdmins" y el request no es de un admin denegamos
        
        const fieldsJSON = req.query.fields as string;
        const fieldsOBJ = isValidJSON(fieldsJSON) ? JSON.parse(fieldsJSON) : ["*"];    

        const conditionJSON = req.query.condition as string;
        const conditionOBJ = isValidJSON(conditionJSON) ? JSON.parse(conditionJSON) : undefined;    
       
        const countJSON = req.query.count as string;                                                    //Si count=true se devuelve el número de filas
        const countOBJ = countJSON === "true" || countJSON === "false" ? JSON.parse(countJSON) as boolean: false;    

        const offset = !isNaN(parseInt(req.query.offset as string)) ? parseInt(req.query.offset as string) : undefined;  
        const limit = !isNaN(parseInt(req.query.limit as string)) ? parseInt(req.query.limit as string) : undefined;

        const orderByJSON = req.query.orderBy as string;
        const orderByOBJ = isValidJSON(orderByJSON) ? JSON.parse(orderByJSON) : undefined;

        const response = await getDao().getTable({tableName: tableName, fields: fieldsOBJ, conditions: conditionOBJ, offset: offset, limit: limit, orderBy: orderByOBJ, count: countOBJ});
        
        if (response.success && response.data && response.data.length && !countOBJ) {                                                            
            if (tableName === "marca") {                                                                                                        //Si requerimos la tabla "marca" le agregamos las rutas de las imágenes
                response.data.forEach(
                    (data: Partial<Marca>) => {
                        if (data.imagen) {
                            if (data.imagen.includes("firebase/")) {
                                const imageName = data.imagen.split("firebase/")[1];
                                const encodedImageName = encodeURIComponent(imageName);
                                data.imagen = IMAGES_FIREBASE_ROUTE?.replace("_", encodedImageName);
                                data.thumbnailImagen = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedImageName);
                                data.imagenNameToDelete = imageName;
                            } else {
                                const imageName = data.imagen;
                                data.imagen = `${BRANDS_IMAGES_ROUTE}/${imageName}`;
                                data.thumbnailImagen = "";
                            }
                        } else {
                            data.imagen = "";
                        }

                        if (data.logo) {
                            if (data.logo.includes("firebase/")) {
                                const logoName = data.logo.split("firebase/")[1];
                                const encodedLogoName = encodeURIComponent(logoName);
                                data.logo = IMAGES_FIREBASE_ROUTE?.replace("_", encodedLogoName);
                                data.thumbnailLogo = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedLogoName);
                                data.logoNameToDelete = logoName;
                            } else {
                                const logoName = data.logo;
                                data.logo = `${BRANDS_IMAGES_ROUTE}/${logoName}`;
                                data.thumbnailLogo = "";
                            }
                        } else {
                            data.logo= "";
                        }

                        if (data.pdf) {
                            if (data.pdf.includes("firebase/")) {
                                const pdfName = data.pdf.split("firebase/")[1];
                                const encodedPdfName = encodeURIComponent(pdfName);
                                data.pdf = DOCUMENTS_FIREBASE_ROUTE?.replace("_", encodedPdfName);
                                data.pdfNameToDelete = pdfName;
                                data.pdfName = pdfName;
                            } else {
                                const pdfName = data.pdf;
                                data.pdf = `${BRANDS_IMAGES_ROUTE}/${pdfName}`;
                                data.pdfName = pdfName;
                            }
                        } else {
                            data.pdf = "";
                        }

                        if (data.pdf_recomendado) {
                            if (data.pdf_recomendado.includes("firebase/")) {
                                const pdfName = data.pdf_recomendado.split("firebase/")[1];
                                const encodedPdfName = encodeURIComponent(pdfName);
                                data.pdf_recomendado = DOCUMENTS_FIREBASE_ROUTE?.replace("_", encodedPdfName);
                                data.pdfRecomendadoNameToDelete = pdfName;
                                data.pdfRecomendadoName = pdfName;
                            } else {
                                const pdfName = data.pdf_recomendado;
                                data.pdf_recomendado = `${BRANDS_IMAGES_ROUTE}/${pdfName}`;
                                data.pdfRecomendadoName = pdfName;
                            }
                        } else {
                            data.pdf_recomendado = "";
                        }
                    }
                );                  
            }
            if (tableName === "faqs_answer") {                                                                                                  //Si requerimos la tabla "faqs_answer" le agregamos las rutas de las imágenes
                response.data.forEach((row: any) => {                                                                                           // sacamos los textos añadidos "#img#" y "#txt#"
                    if (row.value.includes("#img#")) {                                                                                          // i concatenamos los nombres de las imagenes con sus rutas
                        row.value = `${FAQS_IMAGES_ROUTE}/`.concat(row.value);
                    } else if (row.value.includes("firebase/")) {
                        const imageName = row.value.split("firebase/")[1];
                        const encodedImageName = encodeURIComponent(imageName);
                        const url = IMAGES_FIREBASE_ROUTE?.replace("_", encodedImageName);
                        row.value = url;
                    }
                    row.value = row.value.replace("#txt#", "").replace("#img#", "");
                });
            }
            if ((tableName === "nota" && fieldsOBJ.includes("foto")) || (tableName === "nota" && fieldsOBJ[0] === "*")) {                       //Si requerimos la tabla "nota" y el campo "foto" le agregamos las rutas del thumbnail y la foto
                response.data = response.data.map((data: any) => ({
                    ...data, 
                    thumbnail: `${BLOG_THUMBNAILS_ROUTE}/${data.foto}`, 
                    foto: `${BLOG_IMAGES_ROUTE}/${data.foto}`
                }));
            }
            if (tableName === "usuario" && !req.decoded?.isAdmin) {                                                                             //Si se requiere la tabla "usuario" solo enviamos el password a admins
                const data: Usuario[] = response.data;       
                data.forEach((userData) => {
                    delete userData.password;
                    delete userData.token;
                });                                                                                    
            }
            if (tableName === "producto") {                                                                                                      //Si se requiere la tabla "usuario" no enviamos el password
                const globalMultiplier = await getGlobalMultiplier();
                
                response.data.forEach(
                    (data: Partial<Producto>) => {
                        if (data.foto1) {
                            if (data.foto1.includes("firebase/")) {
                                const foto1Name = data.foto1.split("firebase/")[1];
                                const encodedFoto1Name = encodeURIComponent(foto1Name);
                                data.foto1 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                                data.thumbnail1 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                                data.foto1NameToDelete = foto1Name;
                            } else {
                                const encodedFoto1Name = encodeURIComponent(data.foto1);
                                data.foto1 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                                data.thumbnail1 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                            }
                        } 

                        if (data.foto2) {
                            if (data.foto2.includes("firebase/")) {
                                const foto2Name = data.foto2.split("firebase/")[1];
                                const encodedFoto2Name = encodeURIComponent(foto2Name);
                                data.foto2 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                                data.thumbnail2 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                                data.foto2NameToDelete = foto2Name;
                            } else {
                                const encodedFoto2Name = encodeURIComponent(data.foto2);
                                data.foto2 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                                data.thumbnail2 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                            }
                        } 
                        
                        if (data.precio) {
                            data.precioDolar = data.precio;
                            data.precio = Math.ceil(data.precio * globalMultiplier);
                        }
                    }
                );                                                                                   
            }

        } else if (!response.success) {
            console.error(response.message);
        }
        
        if (response.success) {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
};

export const getProductByID = async (req: Request, res: Response) => {
    try {
        
        const id = parseInt(req.query.id as string);
        if (!id || id < 0) throw new CustomError("ID en query inválido", 400);  
        const response = await getDao().getProductByID(id);

        const globalMultiplier = await getGlobalMultiplier();

        if (response.success &&  response.data) {
            response.data.forEach(
                (data: Partial<Producto>) => {
                    if (data.foto1) {
                        if (data.foto1.includes("firebase/")) {
                            const foto1Name = data.foto1.split("firebase/")[1];
                            const encodedFoto1Name = encodeURIComponent(foto1Name);
                            data.foto1 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                            data.thumbnail1 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                            data.foto1NameToDelete = foto1Name;
                        } else {
                            const encodedFoto1Name = encodeURIComponent(data.foto1);
                            data.foto1 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                            data.thumbnail1 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto1Name);
                        }
                    } else {
                        data.foto1 = "";
                        data.thumbnail1 = "";
                    }
                    
                    if (data.foto2) {
                        if (data.foto2.includes("firebase/")) {
                            const foto2Name = data.foto2.split("firebase/")[1];
                            const encodedFoto2Name = encodeURIComponent(foto2Name);
                            data.foto2 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                            data.thumbnail2 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                            data.foto2NameToDelete = foto2Name;
                        } else {
                            const encodedFoto2Name = encodeURIComponent(data.foto2);
                            data.foto2 = IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                            data.thumbnail2 = THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto2Name);
                        }
                    } else {
                        data.foto2 = "";
                        data.thumbnail2 = "";
                    }

                    if (data.precio) {
                        data.precioDolar = data.precio;
                        data.precio = Math.ceil(data.precio * globalMultiplier);
                    }
                }
            );        
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
};

export const getProductsByIDs = async (req: Request, res: Response) => {
    try {
        
        const idsArrJSON = req.query.ids as string;
        const idsArrOBJ = isValidJSON(idsArrJSON) ? JSON.parse(idsArrJSON) : [];    
        const fieldsJSON = req.query.fields as string;
        const fieldsArrOBJ = isValidJSON(fieldsJSON) ? JSON.parse(fieldsJSON) : [];

        const response = await getDao().getProductsByIDs({fieldsArr: fieldsArrOBJ, productsIDsArr: idsArrOBJ});

        const globalMultiplier = await getGlobalMultiplier();

        if (response.success &&  response.data) {
            response.data = response.data.map((data: any) => {
                const encodedFoto1Name = data.foto1 ? encodeURIComponent(data.foto1) : "";
                const encodedFoto2Name = data.foto2 ? encodeURIComponent(data.foto2) : "";
                
                return {
                    ...data, 
                    foto1: data.foto1 ? IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto1Name) : "", 
                    foto2: data.foto2 ? IMAGES_FIREBASE_ROUTE?.replace("_", encodedFoto2Name) : "", 
                    thumbnail1: data.foto1 ? THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto1Name) : "",
                    thumbnail2: data.foto2 ? THUMBNAILS_FIREBASE_ROUTE?.replace("_", encodedFoto2Name) : "",
                    precio: Math.ceil(data.precio * globalMultiplier),                                          //Ajustamos el precio de salida según el multiplicador global
                    precioDolar: data.precio,
                };
            });
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
};

export const updateTable = async (req: Request, res: Response) => {
    try {
        
        const data = req.body as (Usuario & Producto);
        
        const tableName = req.query.tableName as string;
        if (!tablesForWriteByFrontEnd.includes(tableName) && !tablesForWriteByAdmins.includes(tableName)) throw new CustomError("Permiso denegado", 401);         //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (tablesForWriteByAdmins.includes(tableName) && !req.decoded?.isAdmin) throw new CustomError("Permiso denegado", 401);   

        const conditionsJSON = req.query.condition as string;
        const conditionsOBJ: {field: string, value: string | number}[] = isValidJSON(conditionsJSON) ? JSON.parse(conditionsJSON) : [];
        if (!conditionsOBJ.length) throw new CustomError("No se pudo actualizar la tabla. No se pudieron obtener las condiciones", 400);

        conditionsOBJ?.forEach((conditionOBJ) => {
            if (
                !data ||
                !tableName ||
                !conditionOBJ ||
                typeof conditionOBJ !== "object" ||
                Object.keys(conditionOBJ).length !== 2 ||
                !Object.keys(conditionOBJ).includes("field") ||
                !Object.keys(conditionOBJ).includes("value") ||
                Object.values(conditionOBJ).some((value) => !value)
            ) throw new CustomError("No se pudo actualizar la tabla. Condiciones iválidas", 400);
        });

        /*Verificaciones por si se quiere editar la tabla de usuarios */

        if (tableName === "usuario") {
            const isAdmin = req.decoded?.isAdmin;
            if (!isAdmin && data.email && req.decoded?.email !== data.email) throw new CustomError("Permiso denegado, no posee los permisos para modificar el email", 401);     //Si se trata de un usuario que envia un mail diferente al que tiene el token se rechaza la solicitud
            
            if (!isAdmin) {
                data.permisos = "0";                                                                                                                                            //Como "updateTable" es un endpoit al que pude acceder un usuario habilitado sin ser admin, si no es un admin                                               
            }                                                                                                                                                                   // ponemos en 0 el permiso de administrador (Para que un usuario habilitado no pueda habilitarse a si mismo el permiso de admin desde Postman por ej.)
            
            if (data.email) {
                const response1 = await getDao().getTable({tableName: "usuario", fields: ["id"], conditions: [{field: "email", value: data.email}]});                           //Si viene un email como dato para editar verificamos si ya existe...
                if (response1.success && response1.data && response1.data.length) {
                    const existUserData: Usuario = response1.data[0];
                    const existUserID = existUserData.id;
                    const originalDataID = data.id;
                    if (existUserID !== originalDataID) {                                                                                                                       //Si el email existe en la base de datos solo podemos editar la tabla si el email que viene del front correponde a los datos del formulario de edicion 
                        throw new CustomError("El usuario ya existe, el E-mail ya fué registrado", 400);
                    }
                } else if (!response1.success) {
                    throw new Error(response1.message);
                }   
            }  
        }
           
        const response = await getDao().updateTable({tableName: tableName, conditions: conditionsOBJ, data: data});
      
        if (response.success) {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            console.error(response.message);
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
};

export const updateProductsOrder = async (req: Request, res: Response) => {
    try {
        
        const newProductsOrderArr = req.body as NewProductsOrderArr || [];    //{ id: number, order: number }[];
      
        const response1 = await getDao().updateProductsOrder({newProductsOrderArr});                          //Si viene un email como dato para editar verificamos si ya existe...
        if (response1.success) {
            res.status(200).json(response1 as DatabaseControllers_CustomResponse);
        } else {
            console.error(response1.message);
            res.status(500).json(response1 as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({success: false, data: null, message: message} as DatabaseControllers_CustomResponse);
    }
};

export const insertRow = async (req: Request, res: Response) => {
    try {
        const tableName = req.query.tableName as string;
        if (!tablesForWriteByFrontEnd.includes(tableName) && !tablesForWriteByAdmins.includes(tableName)) throw new CustomError("Permiso denegado", 401);         //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (tablesForWriteByAdmins.includes(tableName) && !req.decoded?.isAdmin) throw new CustomError("Permiso denegado", 401); 

        const userData = req.body as any;
        if (!userData || typeof userData !== "object") throw new CustomError("Datos inválidos", 400);

        if (tableName === "usuario") {                                                                                                                           //Si se agrega un usuario se verifica que el email no esté regitrado
            const response = await getDao().getTable({tableName: "usuario", fields: ["id"], conditions: [{field: "email", value: userData.email}]});
            if (response.success && response.data && response.data.length) {
                throw new CustomError("El usuario ya existe, el E-mail ya fué registrado", 400);
            } else if (!response.success) {
                throw new Error(response.message);
            }
        }

        const response = await getDao().insertRow({ tableName: tableName, data: userData });
        if (response.success) {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            console.error(response.message);
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

export const deleteRowByID = async (req: Request, res: Response) => {
    try {
        const tableName = req.query.tableName as string;
        if (!tablesForDeleteByFrontEnd.includes(tableName) && !tablesForDeleteByAdmins.includes(tableName)) throw new CustomError("Permiso denegado", 401);         //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (tablesForDeleteByAdmins.includes(tableName) && !req.decoded?.isAdmin) throw new CustomError("Permiso denegado", 401);  

        const rowID = req.query.rowID as string;
        const parsedRowId = parseInt(rowID);
        if (!rowID || isNaN(parsedRowId) || parsedRowId < 0) throw new CustomError("ID inválido", 400);

        const response = await getDao().deleteRowById({tableName: tableName, rowID: parsedRowId});
        if (response.success) {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            console.error(response.message);
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

export const deleteRows = async (req: Request, res: Response) => {
    try {
        const tableName = req.query.tableName as string;
        if (!tablesForDeleteByFrontEnd.includes(tableName) && !tablesForDeleteByAdmins.includes(tableName)) throw new CustomError("Permiso denegado", 401);         //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (tablesForDeleteByAdmins.includes(tableName) && !req.decoded?.isAdmin) throw new CustomError("Permiso denegado", 401);  
        
        const conditionsJSON = req.query.conditions as string;
        if (!isValidJSON(conditionsJSON)) throw new CustomError("No se pudieron eliminar filas. Condiciones no válidas", 401); 
        const conditionsOBJ = JSON.parse(conditionsJSON);  

        const response = await getDao().deleteRows({tableName: tableName, conditions: conditionsOBJ});

        if (response.success && typeof response.data === "number") {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else if (!response.success) {
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const userData: any = req.body;
        if (!userData || typeof userData !== "object") throw new CustomError("Datos inválidos", 400);
        
        const response1 = await getDao().getTable({tableName: "usuario", fields: ["id"], conditions: [{field: "email", value: userData.email}]});
        if (response1.success && response1.data && response1.data.length) {
            throw new CustomError("El usuario ya existe, el E-mail ya fué registrado", 400);
        } else if (!response1.success) {
            throw new Error(response1.message);
        }      
        
        const fieldsFromFrot: Array<keyof Usuario> = ["nombre", "apellido", "empresa", "pais", "provincia", "ciudad", "direccion", "celular", "telefono", "donde_conociste", "email", "password", "newsletter", "rubro"];
        const userDataSatinized = structuredClone(userDefaultValues);
        fieldsFromFrot.forEach((field) => {
            if (userData[field]) userDataSatinized[field] = userData[field];
        });
        userDataSatinized.fecha_alta = currentDateForDB();                                    //Fecha actual en formato "yyyy-mm-dd" (que acepta mySQL)
                                                                   
        userDataSatinized.permisos = "0";                                                     //Como "createUser" es un endpoit al que se pude acceder sin token                                               
        userDataSatinized.habilitado = "0";                                                   // cuando cremamos un usuario ponemos en 0 el permiso para acceder a la web y en 0 el de administrador (Para que no se pueda crear un usuario habilitado o admin desde Postman por ej.)
        
        const response2 = await getDao().insertRow({tableName: "usuario", data: userDataSatinized});
        if (response2.success) {
            res.status(200).json(response2 as DatabaseControllers_CustomResponse);
        } else {
            console.error(response2.message);
            res.status(500).json(response2 as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

export const saveCartData = async (req: Request, res: Response) => {
    try {
        const cartData: CartDataForDBFromFront = req.body;
        if (!cartData || typeof cartData !== "object") throw new CustomError("Datos inválidos", 400);

        const userEmailFromToken = req.decoded?.email;
        if (userEmailFromToken !== cartData.userEmail) throw new CustomError("No autorizado", 401);

        const response = await getDao().saveCart(cartData);
        if (response.success) {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            console.error(response.message);
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

export const getCartData = async (req: Request, res: Response) => {
    try {
        const userEmail = req.query.userEmail as string;
        if (!userEmail || typeof userEmail !== "string") throw new CustomError("Datos inválidos", 400);

        const userEmailFromToken = req.decoded?.email;
        if (userEmailFromToken !== userEmail) throw new CustomError("No autorizado", 401);

        const response = await getDao().getCart({userEmail: userEmail});
        if (response.success) {
            res.status(200).json(response as DatabaseControllers_CustomResponse);
        } else {
            console.error(response.message);
            res.status(500).json(response as DatabaseControllers_CustomResponse);
        }
    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

export const enableUser = async (req: Request, res: Response) => {
    try {

        if (!req.decoded || (req.decoded && !req.decoded.email)) throw new CustomError("No se envió el email del usuario a habilitar", 401);
        const userEmailToEnable = req.decoded.email;

        const response1 = await getDao().updateTable({tableName: "usuario", conditions: [{field: "email", value: userEmailToEnable}], data: {"habilitado": "1"}});
        if (response1.success) {
            
            let emailNotificationInfo = "Ocurrió un error al notificar al usuariopor email";                                /* Envío de notificación por email al cliente*/
            if (CURRENT_API_BASE_URL && JWT3_SECRET) {                                                                      
                const emailHTMLTemplate = path.resolve(__dirname, "../data/mailsTemplates/email-usuario-habilitado.html");
                const htmlContent = fs.readFileSync(emailHTMLTemplate, "utf8");
                const htmlContentCompleted =
                htmlContent
                    .replace("#nombre#", "Cliente")
                    .replace("#apellido#", "")
                    .replace("#url#", CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jwt.sign({email: userEmailToEnable}, JWT3_SECRET)}`);
                const response2 = await sendMails({emailsArr: [{email: userEmailToEnable}], message: htmlContentCompleted});
                if (response2.success) {
                    await getDao().inserNotificationLog({recipients: userEmailToEnable, notificationType: "Cuenta habilitada"});
                    emailNotificationInfo = "Notificación enviada al usuario por email";
                } 
            } 
            
            res.status(200).send(`Usuario Habilitado con Éxito. ${emailNotificationInfo}. Puede cerrar la ventana`);
        } else {
            console.error(response1.message);
            res.status(500).send(`Error al habilitar usuario: ${response1.message}. Puede cerrar la ventana`);
        }      

    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};

export const usersLogs = async (req: Request, res: Response): Promise <Response<any, Record<string, any>> | void> => {
    try {
        const {userId, email} = req.decoded ? req.decoded : {userId: undefined, email: undefined};
        const {userIP, deviceInfo, device, loginError, origin}: {userIP: string, deviceInfo: string, device: string, loginError: {email: string, password: string} | undefined, origin: string} = req.body;
                   
        const response0 = await getDao().getLastRowForUser(userIP);
        if (response0.success && response0.data) {
            const lastLog: Log = response0.data;
            const lastDate = new Date(lastLog.date).getTime();
            const currentDate = Date.now();
            const diff = currentDate - lastDate;
            const diffMinutes = diff / (1000 * 60);
            if ((diffMinutes < 5 && email && lastLog.ingreso !== "error" && lastLog.origen === origin) || (diffMinutes < 0.08 && !email)) {     //No generamos log si hay 2 entradas ok con la misma ip y mismo origen en menos de 5 minutos
                return res.status(200).json({success: true, data: null, message: response0.message} as DatabaseControllers_CustomResponse);     // o 2 entradas erroneas con la misma ip en menos de 5 segundos (para capturar entradas de mail o contraseña consecutivas incorrectas)
            } 
        } 
        
        const userFields: (keyof Usuario)[] = ["password"];
        const response2 = await getDao().getTable({tableName: "usuario", conditions: [{field: "id", value: userId || 0}], fields: userFields});
        const userData = response2.data && response2.data.length ? response2.data[0] as Required<Pick<Usuario, "password">> : null;
        const userPassword = userData ? userData.password : "";

        const dateTime = getCurrentDateTime();

        const userFieldsRecovery: (keyof Usuario)[] = ["password", "id"];
        const response = await getDao().getTable({tableName: "usuario", conditions: [{field: "email", value: loginError?.email || ""}], fields: userFieldsRecovery});
        const userDataRecovery = response.data && response.data.length ? response.data[0] as Required<Pick<Usuario, "password" | "id">> : null;

        const data: Omit<Log, "id"> = 
        userId && email ?                                                       //Datos de log para ingreso ok
            {
                id_usuario: userId, 
                email:  email, 
                ip: userIP, 
                device_info: deviceInfo, 
                password: userPassword, 
                date: dateTime, 
                time: Date.now(), device, 
                clave: "", 
                ingreso: "ok",
                origen: origin,
            } 
            
            :

            {                                                                   //Datos de log para ingreso denegado
                id_usuario: userDataRecovery?.id.toString() || "", 
                email:  loginError?.email || "Valor no ingresado", 
                ip: userIP, 
                device_info: deviceInfo, 
                password: loginError?.password || "Valor no ingresado", 
                date: dateTime, 
                time: Date.now(), device, 
                clave: "", 
                ingreso: "error",
                origen: origin,
            };

        const response3 = await getDao().insertRow({tableName: "log", data});
        if (!response3.success || !response3.data || !response3.data.length) throw new CustomError(response3.message, 500);
        
        res.status(200).json(response3 as DatabaseControllers_CustomResponse);
    } catch (err) {
        let message: string = "";
        if (err instanceof CustomError) {
            message = err.message;
        } else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        } else {
            message = "ERROR: " + err;
        }
        const status = err instanceof CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message } as DatabaseControllers_CustomResponse);
    }
};
