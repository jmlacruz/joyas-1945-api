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
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const data_1 = require("../data/data");
const environment_1 = require("../environment");
const customError_1 = require("../types/customError");
const dao_1 = require("../dao");
const utils_1 = require("../utils/utils");
const verifyToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.JWT_SECRET)
            throw new customError_1.CustomError("Error interno del servidor, variable de entorno de login no disponible", 500);
        const token = req.headers.authorization && req.headers.authorization.split(" ").length === 2 ? req.headers.authorization.split(" ")[1] : null;
        if (!token) {
            throw new customError_1.CustomError("Acceso denegado, no se envió el token", 401);
        }
        else {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.JWT_SECRET);
            // Check idle session timeout
            const userResponse = yield (0, dao_1.getDao)().getTable({
                tableName: "usuario",
                conditions: [{ field: "email", value: decoded.email }],
                fields: ["id", "last_activity_at"]
            });
            if (!userResponse.success || !userResponse.data || !userResponse.data.length) {
                throw new customError_1.CustomError("Usuario no encontrado", 401);
            }
            const user = userResponse.data[0];
            const now = new Date();
            const currentDateTime = (0, utils_1.getCurrentDateTime)();
            if (!user.last_activity_at) {
                // First activity - set last_activity_at to now
                yield (0, dao_1.getDao)().updateTable({
                    tableName: "usuario",
                    conditions: [{ field: "id", value: user.id }],
                    data: { last_activity_at: currentDateTime }
                });
            }
            else {
                // Check if session has expired due to inactivity
                const lastActivity = new Date(user.last_activity_at);
                const daysSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceLastActivity > environment_1.SESSION_IDLE_TIMEOUT_DAYS) {
                    // Session expired due to inactivity
                    throw new jsonwebtoken_1.default.TokenExpiredError("Session expired due to inactivity", new Date());
                }
                // Update last_activity_at to current time
                yield (0, dao_1.getDao)().updateTable({
                    tableName: "usuario",
                    conditions: [{ field: "id", value: user.id }],
                    data: { last_activity_at: currentDateTime }
                });
            }
            req.decoded = decoded;
            next();
        }
    }
    catch (err) {
        // Detectar si el error es específicamente por token inválido/expirado
        const isJwtError = err instanceof jsonwebtoken_1.default.JsonWebTokenError ||
            err instanceof jsonwebtoken_1.default.TokenExpiredError ||
            err instanceof jsonwebtoken_1.default.NotBeforeError;
        let message;
        let status;
        if (isJwtError) {
            // Token inválido o sesión expirada por inactividad - indicar al cliente que debe cerrar sesión
            message = "TOKEN_INVALID";
            status = 401;
            console.error(`${data_1.verifyTokenAPIError}: Token inválido o expirado - ${err.message} - (verifyToken)`);
        }
        else if (err instanceof customError_1.CustomError) {
            // Error personalizado (ej: no se envió token, usuario no encontrado)
            message = `${data_1.verifyTokenAPIError}: ${err.message}`;
            status = err.status;
            console.error(`${message} - (verifyToken)`);
        }
        else {
            // Otros errores
            message = `${data_1.verifyTokenAPIError}: ${err instanceof Error ? err.message : err}`;
            status = 500;
            console.error(`${message} - (verifyToken)`);
        }
        res.status(status).json({
            success: false,
            data: null,
            message: message,
            // Agregar flag específico para indicar que debe cerrar sesión
            shouldLogout: isJwtError
        });
    }
});
exports.verifyToken = verifyToken;
//# sourceMappingURL=verifyToken.js.map