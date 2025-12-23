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
exports.usersLogs = exports.enableUser = exports.getCartData = exports.saveCartData = exports.createUser = exports.deleteRows = exports.deleteRowByID = exports.insertRow = exports.updateProductsOrder = exports.updateTable = exports.getProductsByIDs = exports.getProductByID = exports.getTable = exports.getProductsFilteredRowsQuantity = exports.getProductsFiltered = void 0;
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const path_1 = __importDefault(require("path"));
const dao_1 = require("../dao");
const data_1 = require("../data/data");
const environment_1 = require("../environment");
const mails_1 = require("../services/mails");
const customError_1 = require("../types/customError");
const database_1 = require("../utils/database");
const utils_1 = require("../utils/utils");
const validations_1 = require("../validations");
const getProductsFiltered = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = parseInt(req.query.limit) || Infinity; //Si se pone "Infinity" en "limit" trae todos los productos (parseInt(Infinity) => NaN)
        const offset = parseInt(req.query.offset) || 0;
        const orderBy = req.query.orderBy; //Tambien puede venir "" u otro valos string pero se pone el tipo para que me los reconozca en el switch de la funcion de consulta
        const brand = parseInt(req.query.brand) || null;
        const conditionJSON = req.query.condition;
        const conditionOBJ = (0, utils_1.isValidJSON)(conditionJSON) ? JSON.parse(conditionJSON) : { field: true, operator: "=", value: true }; //Si no hay condición muestra todos los productos 
        const fieldsJSON = req.query.fields;
        const fieldsOBJ = (0, utils_1.isValidJSON)(fieldsJSON) ? JSON.parse(fieldsJSON) : ["*"]; //Si no se especifican los campos se devuleven todos
        const searchWordsJSON = req.query.searchWords;
        const searchWordsOBJ = (0, utils_1.isValidJSON)(searchWordsJSON) ? JSON.parse(searchWordsJSON) : [];
        const categoriesArrJSON = req.query.categories;
        const categoriesArrOBJ = (0, utils_1.isValidJSON)(categoriesArrJSON) ? JSON.parse(categoriesArrJSON) : [];
        const priceRangeArrJSON = req.query.priceRange;
        const priceRangeArrOBJ = (0, utils_1.isValidJSON)(priceRangeArrJSON) ? JSON.parse(priceRangeArrJSON) : [];
        const globalMultiplier = yield (0, database_1.getGlobalMultiplier)();
        if ((0, validations_1.validatePriceRange)(priceRangeArrOBJ)) {
            priceRangeArrOBJ[0] = priceRangeArrOBJ[0] / globalMultiplier;
            priceRangeArrOBJ[1] = priceRangeArrOBJ[1] / globalMultiplier;
        }
        else {
            priceRangeArrOBJ.length = 0;
        }
        const response2 = yield (0, dao_1.getDao)().getProductsFiltered({ limit: limit, offset: offset, fields: fieldsOBJ, condition: conditionOBJ, searchWords: searchWordsOBJ, categories: categoriesArrOBJ, priceRange: priceRangeArrOBJ, orderBy: orderBy, brand: brand });
        if (response2.success) {
            response2.data.forEach((data) => {
                if (data.foto1) {
                    if (data.foto1.includes("firebase/")) {
                        const foto1Name = data.foto1.split("firebase/")[1];
                        const encodedFoto1Name = encodeURIComponent(foto1Name);
                        data.foto1 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                        data.thumbnail1 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                        data.foto1NameToDelete = foto1Name;
                    }
                    else {
                        const encodedFoto1Name = encodeURIComponent(data.foto1);
                        data.foto1 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                        data.thumbnail1 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                    }
                }
                else {
                    data.foto1 = "";
                    data.thumbnail1 = "";
                }
                if (data.foto2) {
                    if (data.foto2.includes("firebase/")) {
                        const foto2Name = data.foto2.split("firebase/")[1];
                        const encodedFoto2Name = encodeURIComponent(foto2Name);
                        data.foto2 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                        data.thumbnail2 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                        data.foto2NameToDelete = foto2Name;
                    }
                    else {
                        const encodedFoto2Name = encodeURIComponent(data.foto2);
                        data.foto2 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                        data.thumbnail2 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                    }
                }
                else {
                    data.foto2 = "";
                    data.thumbnail2 = "";
                }
                if (data.precio) {
                    data.precioDolar = data.precio;
                }
            });
            res.status(200).json(response2);
        }
        else {
            res.status(500).json(response2);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.getProductsFiltered = getProductsFiltered;
const getProductsFilteredRowsQuantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const brand = parseInt(req.query.brand) || null;
        const conditionJSON = req.query.condition;
        const conditionOBJ = (0, utils_1.isValidJSON)(conditionJSON) ? JSON.parse(conditionJSON) : { field: true, operator: "=", value: true }; //Si no hay condición muestra todos los productos 
        const searchWordsJSON = req.query.searchWords;
        const searchWordsOBJ = (0, utils_1.isValidJSON)(searchWordsJSON) ? JSON.parse(searchWordsJSON) : [];
        const categoriesArrJSON = req.query.categories;
        const categoriesArrOBJ = (0, utils_1.isValidJSON)(categoriesArrJSON) ? JSON.parse(categoriesArrJSON) : [];
        const priceRangeArrJSON = req.query.priceRange;
        const priceRangeArrOBJ = (0, utils_1.isValidJSON)(priceRangeArrJSON) ? JSON.parse(priceRangeArrJSON) : [];
        const globalMultiplier = yield (0, database_1.getGlobalMultiplier)();
        if ((0, validations_1.validatePriceRange)(priceRangeArrOBJ)) {
            priceRangeArrOBJ[0] = priceRangeArrOBJ[0] / globalMultiplier;
            priceRangeArrOBJ[1] = priceRangeArrOBJ[1] / globalMultiplier;
        }
        else {
            priceRangeArrOBJ.length = 0;
        }
        const response = yield (0, dao_1.getDao)().getProductsFilteredRowsQuantity({ condition: conditionOBJ, searchWords: searchWordsOBJ, categories: categoriesArrOBJ, priceRange: priceRangeArrOBJ, brand: brand });
        if (response.success) {
            res.status(200).json(response);
        }
        else {
            res.status(500).json(response);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.getProductsFilteredRowsQuantity = getProductsFilteredRowsQuantity;
const getTable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const tableName = req.query.tableName;
        if (!data_1.tablesForReadByFrontEnd.includes(tableName) && !data_1.tablesForReadByAdmins.includes(tableName))
            throw new customError_1.CustomError("Permiso denegado", 401); //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (data_1.tablesForReadByAdmins.includes(tableName) && !((_a = req.decoded) === null || _a === void 0 ? void 0 : _a.isAdmin))
            throw new customError_1.CustomError("Permiso denegado", 401); //Si la tabla requerida está en "tablesForReadByAdmins" y el request no es de un admin denegamos
        const fieldsJSON = req.query.fields;
        const fieldsOBJ = (0, utils_1.isValidJSON)(fieldsJSON) ? JSON.parse(fieldsJSON) : ["*"];
        const conditionJSON = req.query.condition;
        const conditionOBJ = (0, utils_1.isValidJSON)(conditionJSON) ? JSON.parse(conditionJSON) : undefined;
        const countJSON = req.query.count; //Si count=true se devuelve el número de filas
        const countOBJ = countJSON === "true" || countJSON === "false" ? JSON.parse(countJSON) : false;
        const offset = !isNaN(parseInt(req.query.offset)) ? parseInt(req.query.offset) : undefined;
        const limit = !isNaN(parseInt(req.query.limit)) ? parseInt(req.query.limit) : undefined;
        const orderByJSON = req.query.orderBy;
        const orderByOBJ = (0, utils_1.isValidJSON)(orderByJSON) ? JSON.parse(orderByJSON) : undefined;
        const response = yield (0, dao_1.getDao)().getTable({ tableName: tableName, fields: fieldsOBJ, conditions: conditionOBJ, offset: offset, limit: limit, orderBy: orderByOBJ, count: countOBJ });
        if (response.success && response.data && response.data.length && !countOBJ) {
            if (tableName === "marca") { //Si requerimos la tabla "marca" le agregamos las rutas de las imágenes
                response.data.forEach((data) => {
                    if (data.imagen) {
                        if (data.imagen.includes("firebase/")) {
                            const imageName = data.imagen.split("firebase/")[1];
                            const encodedImageName = encodeURIComponent(imageName);
                            data.imagen = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedImageName);
                            data.thumbnailImagen = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedImageName);
                            data.imagenNameToDelete = imageName;
                        }
                        else {
                            const imageName = data.imagen;
                            data.imagen = `${environment_1.BRANDS_IMAGES_ROUTE}/${imageName}`;
                            data.thumbnailImagen = "";
                        }
                    }
                    else {
                        data.imagen = "";
                    }
                    if (data.logo) {
                        if (data.logo.includes("firebase/")) {
                            const logoName = data.logo.split("firebase/")[1];
                            const encodedLogoName = encodeURIComponent(logoName);
                            data.logo = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedLogoName);
                            data.thumbnailLogo = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedLogoName);
                            data.logoNameToDelete = logoName;
                        }
                        else {
                            const logoName = data.logo;
                            data.logo = `${environment_1.BRANDS_IMAGES_ROUTE}/${logoName}`;
                            data.thumbnailLogo = "";
                        }
                    }
                    else {
                        data.logo = "";
                    }
                    if (data.pdf) {
                        if (data.pdf.includes("firebase/")) {
                            const pdfName = data.pdf.split("firebase/")[1];
                            const encodedPdfName = encodeURIComponent(pdfName);
                            data.pdf = environment_1.DOCUMENTS_FIREBASE_ROUTE === null || environment_1.DOCUMENTS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.DOCUMENTS_FIREBASE_ROUTE.replace("_", encodedPdfName);
                            data.pdfNameToDelete = pdfName;
                            data.pdfName = pdfName;
                        }
                        else {
                            const pdfName = data.pdf;
                            data.pdf = `${environment_1.BRANDS_IMAGES_ROUTE}/${pdfName}`;
                            data.pdfName = pdfName;
                        }
                    }
                    else {
                        data.pdf = "";
                    }
                    if (data.pdf_recomendado) {
                        if (data.pdf_recomendado.includes("firebase/")) {
                            const pdfName = data.pdf_recomendado.split("firebase/")[1];
                            const encodedPdfName = encodeURIComponent(pdfName);
                            data.pdf_recomendado = environment_1.DOCUMENTS_FIREBASE_ROUTE === null || environment_1.DOCUMENTS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.DOCUMENTS_FIREBASE_ROUTE.replace("_", encodedPdfName);
                            data.pdfRecomendadoNameToDelete = pdfName;
                            data.pdfRecomendadoName = pdfName;
                        }
                        else {
                            const pdfName = data.pdf_recomendado;
                            data.pdf_recomendado = `${environment_1.BRANDS_IMAGES_ROUTE}/${pdfName}`;
                            data.pdfRecomendadoName = pdfName;
                        }
                    }
                    else {
                        data.pdf_recomendado = "";
                    }
                });
            }
            if (tableName === "faqs_answer") { //Si requerimos la tabla "faqs_answer" le agregamos las rutas de las imágenes
                response.data.forEach((row) => {
                    if (row.value.includes("#img#")) { // i concatenamos los nombres de las imagenes con sus rutas
                        row.value = `${environment_1.FAQS_IMAGES_ROUTE}/`.concat(row.value);
                    }
                    else if (row.value.includes("firebase/")) {
                        const imageName = row.value.split("firebase/")[1];
                        const encodedImageName = encodeURIComponent(imageName);
                        const url = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedImageName);
                        row.value = url;
                    }
                    row.value = row.value.replace("#txt#", "").replace("#img#", "");
                });
            }
            if ((tableName === "nota" && fieldsOBJ.includes("foto")) || (tableName === "nota" && fieldsOBJ[0] === "*")) { //Si requerimos la tabla "nota" y el campo "foto" le agregamos las rutas del thumbnail y la foto
                response.data = response.data.map((data) => (Object.assign(Object.assign({}, data), { thumbnail: `${environment_1.BLOG_THUMBNAILS_ROUTE}/${data.foto}`, foto: `${environment_1.BLOG_IMAGES_ROUTE}/${data.foto}` })));
            }
            if (tableName === "usuario" && !((_b = req.decoded) === null || _b === void 0 ? void 0 : _b.isAdmin)) { //Si se requiere la tabla "usuario" solo enviamos el password a admins
                const data = response.data;
                data.forEach((userData) => {
                    delete userData.password;
                    delete userData.token;
                });
            }
            if (tableName === "producto") { //Si se requiere la tabla "usuario" no enviamos el password
                const globalMultiplier = yield (0, database_1.getGlobalMultiplier)();
                response.data.forEach((data) => {
                    if (data.foto1) {
                        if (data.foto1.includes("firebase/")) {
                            const foto1Name = data.foto1.split("firebase/")[1];
                            const encodedFoto1Name = encodeURIComponent(foto1Name);
                            data.foto1 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                            data.thumbnail1 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                            data.foto1NameToDelete = foto1Name;
                        }
                        else {
                            const encodedFoto1Name = encodeURIComponent(data.foto1);
                            data.foto1 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                            data.thumbnail1 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                        }
                    }
                    if (data.foto2) {
                        if (data.foto2.includes("firebase/")) {
                            const foto2Name = data.foto2.split("firebase/")[1];
                            const encodedFoto2Name = encodeURIComponent(foto2Name);
                            data.foto2 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                            data.thumbnail2 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                            data.foto2NameToDelete = foto2Name;
                        }
                        else {
                            const encodedFoto2Name = encodeURIComponent(data.foto2);
                            data.foto2 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                            data.thumbnail2 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                        }
                    }
                    if (data.precio) {
                        data.precioDolar = data.precio;
                        data.precio = Math.ceil(data.precio * globalMultiplier);
                    }
                });
            }
        }
        else if (!response.success) {
            console.error(response.message);
        }
        if (response.success) {
            res.status(200).json(response);
        }
        else {
            res.status(500).json(response);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.log(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.getTable = getTable;
const getProductByID = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = parseInt(req.query.id);
        if (!id || id < 0)
            throw new customError_1.CustomError("ID en query inválido", 400);
        const response = yield (0, dao_1.getDao)().getProductByID(id);
        const globalMultiplier = yield (0, database_1.getGlobalMultiplier)();
        if (response.success && response.data) {
            response.data.forEach((data) => {
                if (data.foto1) {
                    if (data.foto1.includes("firebase/")) {
                        const foto1Name = data.foto1.split("firebase/")[1];
                        const encodedFoto1Name = encodeURIComponent(foto1Name);
                        data.foto1 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                        data.thumbnail1 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                        data.foto1NameToDelete = foto1Name;
                    }
                    else {
                        const encodedFoto1Name = encodeURIComponent(data.foto1);
                        data.foto1 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                        data.thumbnail1 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto1Name);
                    }
                }
                else {
                    data.foto1 = "";
                    data.thumbnail1 = "";
                }
                if (data.foto2) {
                    if (data.foto2.includes("firebase/")) {
                        const foto2Name = data.foto2.split("firebase/")[1];
                        const encodedFoto2Name = encodeURIComponent(foto2Name);
                        data.foto2 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                        data.thumbnail2 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                        data.foto2NameToDelete = foto2Name;
                    }
                    else {
                        const encodedFoto2Name = encodeURIComponent(data.foto2);
                        data.foto2 = environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                        data.thumbnail2 = environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto2Name);
                    }
                }
                else {
                    data.foto2 = "";
                    data.thumbnail2 = "";
                }
                if (data.precio) {
                    data.precioDolar = data.precio;
                    data.precio = Math.ceil(data.precio * globalMultiplier);
                }
            });
            res.status(200).json(response);
        }
        else {
            res.status(500).json(response);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.getProductByID = getProductByID;
const getProductsByIDs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const idsArrJSON = req.query.ids;
        const idsArrOBJ = (0, utils_1.isValidJSON)(idsArrJSON) ? JSON.parse(idsArrJSON) : [];
        const fieldsJSON = req.query.fields;
        const fieldsArrOBJ = (0, utils_1.isValidJSON)(fieldsJSON) ? JSON.parse(fieldsJSON) : [];
        const response = yield (0, dao_1.getDao)().getProductsByIDs({ fieldsArr: fieldsArrOBJ, productsIDsArr: idsArrOBJ });
        const globalMultiplier = yield (0, database_1.getGlobalMultiplier)();
        if (response.success && response.data) {
            response.data = response.data.map((data) => {
                const encodedFoto1Name = data.foto1 ? encodeURIComponent(data.foto1) : "";
                const encodedFoto2Name = data.foto2 ? encodeURIComponent(data.foto2) : "";
                return Object.assign(Object.assign({}, data), { foto1: data.foto1 ? environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto1Name) : "", foto2: data.foto2 ? environment_1.IMAGES_FIREBASE_ROUTE === null || environment_1.IMAGES_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.IMAGES_FIREBASE_ROUTE.replace("_", encodedFoto2Name) : "", thumbnail1: data.foto1 ? environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto1Name) : "", thumbnail2: data.foto2 ? environment_1.THUMBNAILS_FIREBASE_ROUTE === null || environment_1.THUMBNAILS_FIREBASE_ROUTE === void 0 ? void 0 : environment_1.THUMBNAILS_FIREBASE_ROUTE.replace("_", encodedFoto2Name) : "", precio: Math.ceil(data.precio * globalMultiplier), precioDolar: data.precio });
            });
            res.status(200).json(response);
        }
        else {
            res.status(500).json(response);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.getProductsByIDs = getProductsByIDs;
const updateTable = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    try {
        const data = req.body;
        const tableName = req.query.tableName;
        if (!data_1.tablesForWriteByFrontEnd.includes(tableName) && !data_1.tablesForWriteByAdmins.includes(tableName))
            throw new customError_1.CustomError("Permiso denegado", 401); //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (data_1.tablesForWriteByAdmins.includes(tableName) && !((_c = req.decoded) === null || _c === void 0 ? void 0 : _c.isAdmin))
            throw new customError_1.CustomError("Permiso denegado", 401);
        const conditionsJSON = req.query.condition;
        const conditionsOBJ = (0, utils_1.isValidJSON)(conditionsJSON) ? JSON.parse(conditionsJSON) : [];
        if (!conditionsOBJ.length)
            throw new customError_1.CustomError("No se pudo actualizar la tabla. No se pudieron obtener las condiciones", 400);
        conditionsOBJ === null || conditionsOBJ === void 0 ? void 0 : conditionsOBJ.forEach((conditionOBJ) => {
            if (!data ||
                !tableName ||
                !conditionOBJ ||
                typeof conditionOBJ !== "object" ||
                Object.keys(conditionOBJ).length !== 2 ||
                !Object.keys(conditionOBJ).includes("field") ||
                !Object.keys(conditionOBJ).includes("value") ||
                Object.values(conditionOBJ).some((value) => !value))
                throw new customError_1.CustomError("No se pudo actualizar la tabla. Condiciones iválidas", 400);
        });
        /*Verificaciones por si se quiere editar la tabla de usuarios */
        if (tableName === "usuario") {
            const isAdmin = (_d = req.decoded) === null || _d === void 0 ? void 0 : _d.isAdmin;
            if (!isAdmin && data.email && ((_e = req.decoded) === null || _e === void 0 ? void 0 : _e.email) !== data.email)
                throw new customError_1.CustomError("Permiso denegado, no posee los permisos para modificar el email", 401); //Si se trata de un usuario que envia un mail diferente al que tiene el token se rechaza la solicitud
            if (!isAdmin) {
                data.permisos = "0"; //Como "updateTable" es un endpoit al que pude acceder un usuario habilitado sin ser admin, si no es un admin                                               
            } // ponemos en 0 el permiso de administrador (Para que un usuario habilitado no pueda habilitarse a si mismo el permiso de admin desde Postman por ej.)
            if (data.email) {
                const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", fields: ["id"], conditions: [{ field: "email", value: data.email }] }); //Si viene un email como dato para editar verificamos si ya existe...
                if (response1.success && response1.data && response1.data.length) {
                    const existUserData = response1.data[0];
                    const existUserID = existUserData.id;
                    const originalDataID = data.id;
                    if (existUserID !== originalDataID) { //Si el email existe en la base de datos solo podemos editar la tabla si el email que viene del front correponde a los datos del formulario de edicion 
                        throw new customError_1.CustomError("El usuario ya existe, el E-mail ya fué registrado", 400);
                    }
                }
                else if (!response1.success) {
                    throw new Error(response1.message);
                }
            }
        }
        const response = yield (0, dao_1.getDao)().updateTable({ tableName: tableName, conditions: conditionsOBJ, data: data });
        if (response.success) {
            res.status(200).json(response);
        }
        else {
            console.error(response.message);
            res.status(500).json(response);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.updateTable = updateTable;
const updateProductsOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newProductsOrderArr = req.body || []; //{ id: number, order: number }[];
        const response1 = yield (0, dao_1.getDao)().updateProductsOrder({ newProductsOrderArr }); //Si viene un email como dato para editar verificamos si ya existe...
        if (response1.success) {
            res.status(200).json(response1);
        }
        else {
            console.error(response1.message);
            res.status(500).json(response1);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.updateProductsOrder = updateProductsOrder;
const insertRow = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const tableName = req.query.tableName;
        if (!data_1.tablesForWriteByFrontEnd.includes(tableName) && !data_1.tablesForWriteByAdmins.includes(tableName))
            throw new customError_1.CustomError("Permiso denegado", 401); //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (data_1.tablesForWriteByAdmins.includes(tableName) && !((_f = req.decoded) === null || _f === void 0 ? void 0 : _f.isAdmin))
            throw new customError_1.CustomError("Permiso denegado", 401);
        const userData = req.body;
        if (!userData || typeof userData !== "object")
            throw new customError_1.CustomError("Datos inválidos", 400);
        if (tableName === "usuario") { //Si se agrega un usuario se verifica que el email no esté regitrado
            const response = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", fields: ["id"], conditions: [{ field: "email", value: userData.email }] });
            if (response.success && response.data && response.data.length) {
                throw new customError_1.CustomError("El usuario ya existe, el E-mail ya fué registrado", 400);
            }
            else if (!response.success) {
                throw new Error(response.message);
            }
        }
        const response = yield (0, dao_1.getDao)().insertRow({ tableName: tableName, data: userData });
        if (response.success) {
            res.status(200).json(response);
        }
        else {
            console.error(response.message);
            res.status(500).json(response);
        }
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.insertRow = insertRow;
const deleteRowByID = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const tableName = req.query.tableName;
        if (!data_1.tablesForDeleteByFrontEnd.includes(tableName) && !data_1.tablesForDeleteByAdmins.includes(tableName))
            throw new customError_1.CustomError("Permiso denegado", 401); //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (data_1.tablesForDeleteByAdmins.includes(tableName) && !((_g = req.decoded) === null || _g === void 0 ? void 0 : _g.isAdmin))
            throw new customError_1.CustomError("Permiso denegado", 401);
        const rowID = req.query.rowID;
        const parsedRowId = parseInt(rowID);
        if (!rowID || isNaN(parsedRowId) || parsedRowId < 0)
            throw new customError_1.CustomError("ID inválido", 400);
        const response = yield (0, dao_1.getDao)().deleteRowById({ tableName: tableName, rowID: parsedRowId });
        if (response.success) {
            res.status(200).json(response);
        }
        else {
            console.error(response.message);
            res.status(500).json(response);
        }
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.deleteRowByID = deleteRowByID;
const deleteRows = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const tableName = req.query.tableName;
        if (!data_1.tablesForDeleteByFrontEnd.includes(tableName) && !data_1.tablesForDeleteByAdmins.includes(tableName))
            throw new customError_1.CustomError("Permiso denegado", 401); //Solo se pueden leer tablas incluidas en "tablesForReadByFrontEnd" (usuarios) O "tablesForReadByAdmins" (admins)
        if (data_1.tablesForDeleteByAdmins.includes(tableName) && !((_h = req.decoded) === null || _h === void 0 ? void 0 : _h.isAdmin))
            throw new customError_1.CustomError("Permiso denegado", 401);
        const conditionsJSON = req.query.conditions;
        if (!(0, utils_1.isValidJSON)(conditionsJSON))
            throw new customError_1.CustomError("No se pudieron eliminar filas. Condiciones no válidas", 401);
        const conditionsOBJ = JSON.parse(conditionsJSON);
        const response = yield (0, dao_1.getDao)().deleteRows({ tableName: tableName, conditions: conditionsOBJ });
        if (response.success && typeof response.data === "number") {
            res.status(200).json(response);
        }
        else if (!response.success) {
            res.status(500).json(response);
        }
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.deleteRows = deleteRows;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = req.body;
        if (!userData || typeof userData !== "object")
            throw new customError_1.CustomError("Datos inválidos", 400);
        const response1 = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", fields: ["id"], conditions: [{ field: "email", value: userData.email }] });
        if (response1.success && response1.data && response1.data.length) {
            throw new customError_1.CustomError("El usuario ya existe, el E-mail ya fué registrado", 400);
        }
        else if (!response1.success) {
            throw new Error(response1.message);
        }
        const fieldsFromFrot = ["nombre", "apellido", "empresa", "pais", "provincia", "ciudad", "direccion", "celular", "telefono", "donde_conociste", "email", "password", "newsletter", "rubro"];
        const userDataSatinized = structuredClone(data_1.userDefaultValues);
        fieldsFromFrot.forEach((field) => {
            if (userData[field])
                userDataSatinized[field] = userData[field];
        });
        userDataSatinized.fecha_alta = (0, utils_1.currentDateForDB)(); //Fecha actual en formato "yyyy-mm-dd" (que acepta mySQL)
        userDataSatinized.permisos = "0"; //Como "createUser" es un endpoit al que se pude acceder sin token                                               
        userDataSatinized.habilitado = "0"; // cuando cremamos un usuario ponemos en 0 el permiso para acceder a la web y en 0 el de administrador (Para que no se pueda crear un usuario habilitado o admin desde Postman por ej.)
        const response2 = yield (0, dao_1.getDao)().insertRow({ tableName: "usuario", data: userDataSatinized });
        if (response2.success) {
            res.status(200).json(response2);
        }
        else {
            console.error(response2.message);
            res.status(500).json(response2);
        }
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.createUser = createUser;
const saveCartData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    try {
        const cartData = req.body;
        if (!cartData || typeof cartData !== "object")
            throw new customError_1.CustomError("Datos inválidos", 400);
        const userEmailFromToken = (_j = req.decoded) === null || _j === void 0 ? void 0 : _j.email;
        if (userEmailFromToken !== cartData.userEmail)
            throw new customError_1.CustomError("No autorizado", 401);
        const response = yield (0, dao_1.getDao)().saveCart(cartData);
        if (response.success) {
            res.status(200).json(response);
        }
        else {
            console.error(response.message);
            res.status(500).json(response);
        }
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.saveCartData = saveCartData;
const getCartData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    try {
        const userEmail = req.query.userEmail;
        if (!userEmail || typeof userEmail !== "string")
            throw new customError_1.CustomError("Datos inválidos", 400);
        const userEmailFromToken = (_k = req.decoded) === null || _k === void 0 ? void 0 : _k.email;
        if (userEmailFromToken !== userEmail)
            throw new customError_1.CustomError("No autorizado", 401);
        const response = yield (0, dao_1.getDao)().getCart({ userEmail: userEmail });
        if (response.success) {
            res.status(200).json(response);
        }
        else {
            console.error(response.message);
            res.status(500).json(response);
        }
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.getCartData = getCartData;
const enableUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.decoded || (req.decoded && !req.decoded.email))
            throw new customError_1.CustomError("No se envió el email del usuario a habilitar", 401);
        const userEmailToEnable = req.decoded.email;
        const response1 = yield (0, dao_1.getDao)().updateTable({ tableName: "usuario", conditions: [{ field: "email", value: userEmailToEnable }], data: { "habilitado": "1" } });
        if (response1.success) {
            let emailNotificationInfo = "Ocurrió un error al notificar al usuariopor email"; /* Envío de notificación por email al cliente*/
            if (environment_1.CURRENT_API_BASE_URL && environment_1.JWT3_SECRET) {
                const emailHTMLTemplate = path_1.default.resolve(__dirname, "../data/mailsTemplates/email-usuario-habilitado.html");
                const htmlContent = fs_1.default.readFileSync(emailHTMLTemplate, "utf8");
                const htmlContentCompleted = htmlContent
                    .replace("#nombre#", "Cliente")
                    .replace("#apellido#", "")
                    .replace("#url#", environment_1.CURRENT_API_BASE_URL + `/api/allowAccessToWeb?token=${jsonwebtoken_1.default.sign({ email: userEmailToEnable }, environment_1.JWT3_SECRET)}`);
                const response2 = yield (0, mails_1.sendMails)({ emailsArr: [{ email: userEmailToEnable }], message: htmlContentCompleted });
                if (response2.success) {
                    yield (0, dao_1.getDao)().inserNotificationLog({ recipients: userEmailToEnable, notificationType: "Cuenta habilitada" });
                    emailNotificationInfo = "Notificación enviada al usuario por email";
                }
            }
            res.status(200).send(`Usuario Habilitado con Éxito. ${emailNotificationInfo}. Puede cerrar la ventana`);
        }
        else {
            console.error(response1.message);
            res.status(500).send(`Error al habilitar usuario: ${response1.message}. Puede cerrar la ventana`);
        }
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.enableUser = enableUser;
const usersLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, email } = req.decoded ? req.decoded : { userId: undefined, email: undefined };
        const { userIP, deviceInfo, device, loginError, origin } = req.body;
        const response0 = yield (0, dao_1.getDao)().getLastRowForUser(userIP);
        if (response0.success && response0.data) {
            const lastLog = response0.data;
            const lastDate = new Date(lastLog.date).getTime();
            const currentDate = Date.now();
            const diff = currentDate - lastDate;
            const diffMinutes = diff / (1000 * 60);
            if ((diffMinutes < 5 && email && lastLog.ingreso !== "error" && lastLog.origen === origin) || (diffMinutes < 0.08 && !email)) { //No generamos log si hay 2 entradas ok con la misma ip y mismo origen en menos de 5 minutos
                return res.status(200).json({ success: true, data: null, message: response0.message }); // o 2 entradas erroneas con la misma ip en menos de 5 segundos (para capturar entradas de mail o contraseña consecutivas incorrectas)
            }
        }
        const userFields = ["password"];
        const response2 = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", conditions: [{ field: "id", value: userId || 0 }], fields: userFields });
        const userData = response2.data && response2.data.length ? response2.data[0] : null;
        const userPassword = userData ? userData.password : "";
        const dateTime = (0, utils_1.getCurrentDateTime)();
        const userFieldsRecovery = ["password", "id"];
        const response = yield (0, dao_1.getDao)().getTable({ tableName: "usuario", conditions: [{ field: "email", value: (loginError === null || loginError === void 0 ? void 0 : loginError.email) || "" }], fields: userFieldsRecovery });
        const userDataRecovery = response.data && response.data.length ? response.data[0] : null;
        const data = userId && email ? //Datos de log para ingreso ok
            {
                id_usuario: userId,
                email: email,
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
                {
                    id_usuario: (userDataRecovery === null || userDataRecovery === void 0 ? void 0 : userDataRecovery.id.toString()) || "",
                    email: (loginError === null || loginError === void 0 ? void 0 : loginError.email) || "Valor no ingresado",
                    ip: userIP,
                    device_info: deviceInfo,
                    password: (loginError === null || loginError === void 0 ? void 0 : loginError.password) || "Valor no ingresado",
                    date: dateTime,
                    time: Date.now(), device,
                    clave: "",
                    ingreso: "error",
                    origen: origin,
                };
        const response3 = yield (0, dao_1.getDao)().insertRow({ tableName: "log", data });
        if (!response3.success || !response3.data || !response3.data.length)
            throw new customError_1.CustomError(response3.message, 500);
        res.status(200).json(response3);
    }
    catch (err) {
        let message = "";
        if (err instanceof customError_1.CustomError) {
            message = err.message;
        }
        else if (err instanceof Error) {
            message = "ERROR: " + err.message;
        }
        else {
            message = "ERROR: " + err;
        }
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        console.error(`Error: ${message} -- Status(${status})`);
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.usersLogs = usersLogs;
//# sourceMappingURL=database.js.map