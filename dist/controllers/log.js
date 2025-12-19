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
exports.logOut = exports.isLogged = exports.login = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dao_1 = require("../dao");
const environment_1 = require("../environment");
const getStream_1 = require("../services/getStream");
const customError_1 = require("../types/customError");
const utils_1 = require("../utils/utils");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.JWT_SECRET || !environment_1.JWT_EXPIRATION_TIME)
            throw new customError_1.CustomError("Error interno del servidor, variable de entorno de login no disponible", 500);
        const loginData = req.body;
        if (!loginData)
            throw new customError_1.CustomError("No se enviaron las credenciales de login", 401);
        const fieldsRequired = ["password", "nombre", "permisos", "email", "habilitado", "id", "ciudad", "apellido"];
        const response = yield (0, dao_1.getDao)().getTable({
            tableName: "usuario",
            conditions: [{ field: "email", value: loginData.email }],
            fields: fieldsRequired,
        });
        if (response.success && response.data && response.data.length) {
            const userData = response.data[0];
            if (userData.password !== loginData.password)
                throw new customError_1.CustomError("Credenciales incorrectas", 401);
            if (userData.habilitado !== "1")
                throw new customError_1.CustomError("Su cuenta se encuentra pendiente de habilitación", 401);
            const isAdmin = userData.permisos === "10";
            const userDataForToken = {
                name: userData.nombre,
                lastName: userData.apellido,
                email: userData.email,
                registered: true,
                rememberme: loginData.rememberme,
                isAdmin: isAdmin,
                userId: userData.id.toString(),
                streamChatToken: (0, getStream_1.getStreamChatToken)({ userId: userData.id.toString() }),
                city: userData.ciudad,
                token: "",
            };
            const token = jsonwebtoken_1.default.sign(userDataForToken, environment_1.JWT_SECRET, { expiresIn: environment_1.JWT_EXPIRATION_TIME });
            userDataForToken.token = token;
            // Update last_activity_at after successful login
            yield (0, dao_1.getDao)().updateTable({
                tableName: "usuario",
                conditions: [{ field: "id", value: userData.id }],
                data: { last_activity_at: (0, utils_1.getCurrentDateTime)() }
            });
            res.status(200).json({ success: true, data: userDataForToken, message: "Login correcto" });
        }
        else {
            throw new customError_1.CustomError("Credenciales incorrectas", 401);
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
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.login = login;
const isLogged = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userEmail = (_a = req.decoded) === null || _a === void 0 ? void 0 : _a.email;
        if (!userEmail)
            throw new customError_1.CustomError("Token inválido", 401);
        const fieldsRequired = ["password", "nombre", "permisos", "email", "habilitado", "id", "ciudad", "apellido"];
        const response = yield (0, dao_1.getDao)().getTable({
            tableName: "usuario",
            conditions: [{ field: "email", value: userEmail }],
            fields: fieldsRequired,
        });
        if (response.success && response.data && response.data.length) {
            const userData = response.data[0];
            if (userData.habilitado !== "1")
                throw new customError_1.CustomError("Su cuenta se encuentra pendiente de habilitación", 401);
            const isAdmin = userData.permisos === "10";
            const userDataForToken = {
                name: userData.nombre,
                lastName: userData.apellido,
                email: userData.email,
                registered: true,
                rememberme: true,
                isAdmin: isAdmin,
                streamChatToken: (0, getStream_1.getStreamChatToken)({ userId: userData.id.toString() }),
                userId: userData.id.toString(), city: userData.ciudad,
                token: "",
            };
            res.status(200).json({ success: true, data: userDataForToken, message: "" });
        }
        else {
            throw new customError_1.CustomError("Credenciales incorrectas", 401);
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
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.isLogged = isLogged;
const logOut = (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json({ success: true, data: null, message: "Sesión cerrada correctamente" });
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.logOut = logOut;
//# sourceMappingURL=log.js.map