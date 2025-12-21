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
exports.allowAccessToWeb = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dao_1 = require("../dao");
const environment_1 = require("../environment");
const customError_1 = require("../types/customError");
const utils_1 = require("../utils/utils");
const allowAccessToWeb = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.JWT_SECRET || !environment_1.JWT_EXPIRATION_TIME || !environment_1.CURRENT_FRONT_BASE_URL)
            throw new customError_1.CustomError("Error interno del servidor, variable de entorno de login no disponible", 500);
        if (!req.decoded || (req.decoded && !req.decoded.email))
            throw new customError_1.CustomError("No se pudo obtener el email del usuario en el token enviado, para darle acceso a la web", 401);
        const userEmail = req.decoded.email;
        const { pathName } = req.query;
        const fieldsRequired = ["nombre", "permisos", "email", "habilitado", "id", "ciudad", "apellido"];
        const response = yield (0, dao_1.getDao)().getTable({
            tableName: "usuario",
            conditions: [{ field: "email", value: userEmail }],
            fields: fieldsRequired,
        });
        if (response.success && response.data && response.data.length) {
            const userData = response.data[0];
            if (userData.habilitado !== "1") {
                return (res.status(401).send("Acceso a la web no autorizado. Su cuenta se encuentra deshabilitada"));
            }
            const isAdmin = userData.permisos === "10";
            const userDataForToken = {
                name: userData.nombre,
                lastName: userData.apellido,
                email: userData.email,
                registered: true,
                rememberme: true,
                isAdmin: isAdmin,
                streamChatToken: "",
                userId: userData.id.toString(), city: userData.ciudad,
                token: "",
            };
            const token = jsonwebtoken_1.default.sign(userDataForToken, environment_1.JWT_SECRET, { expiresIn: environment_1.JWT_EXPIRATION_TIME });
            // Update last_activity_at after successful token creation
            yield (0, dao_1.getDao)().updateTable({
                tableName: "usuario",
                conditions: [{ field: "id", value: userData.id }],
                data: { last_activity_at: (0, utils_1.getCurrentDateTime)() }
            });
            res.status(200).redirect(`${environment_1.CURRENT_FRONT_BASE_URL}${pathName ? "/" + pathName + "?token=" + token : "?token=" + token}`);
        }
        else {
            throw new customError_1.CustomError("Credenciales incorrectas", 401);
        }
        return;
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
        return;
    }
});
exports.allowAccessToWeb = allowAccessToWeb;
//# sourceMappingURL=allowAccessToWeb.js.map