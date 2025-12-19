"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTokenForEmailLinkAction = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../environment");
const customError_1 = require("../types/customError");
const verifyTokenForEmailLinkAction = (req, res, next) => {
    if (!environment_1.JWT3_SECRET)
        throw new customError_1.CustomError("Error interno del servidor, variable de entorno para acciones con links en emails (JWT3_SECRET) no disponible", 500);
    const token = req.query.token;
    if (!token) {
        throw new customError_1.CustomError("Acceso denegado, no se envió el token", 401);
    }
    else {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, environment_1.JWT3_SECRET); //En este caso el token solo contiene el objeto {email: string}
            req.decoded = decoded;
            next();
        }
        catch (err) {
            const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
            const status = err instanceof customError_1.CustomError ? err.status : 500;
            res.status(status).json({ success: false, data: null, message: message });
        }
    }
};
exports.verifyTokenForEmailLinkAction = verifyTokenForEmailLinkAction;
//# sourceMappingURL=verifyTokenForEmailLinkAction.js.map