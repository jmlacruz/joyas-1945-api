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
exports.deleteCronJob = exports.updateCronJob = exports.createCronJob = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const environment_1 = require("../environment");
const utils_1 = require("../utils/utils");
const createCronJob = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.JWT2_SECRET || !environment_1.CRON_API_KEY)
            throw new Error("Error interno del servidor, variable para creación de CronJob no disponible");
        const token = jsonwebtoken_1.default.sign({ userEmail: options.userEmail }, environment_1.JWT2_SECRET, { expiresIn: "72h" });
        const { mdays, months, hours, minutes, wdays } = (0, utils_1.calculateFutureDateInHours)(environment_1.CART_REMINDER_WAIT_IN_HOURS);
        const response = yield fetch("https://api.cron-job.org/jobs", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${environment_1.CRON_API_KEY}`
            },
            body: JSON.stringify({
                job: {
                    url: `https://almacendejoyasapi.vercel.app/api/usersNotifications/sendCartReminderMail?token=${token}`,
                    enabled: "true",
                    saveResponses: true,
                    schedule: { "timezone": "America/Argentina/Buenos_Aires", "expiresAt": 0, "hours": [hours], "mdays": [mdays], "minutes": [minutes], "months": [months], "wdays": [wdays] },
                    requestMethod: 0 //0 corresponde a get
                }
            })
        });
        const data = yield response.json();
        const jobId = data.jobId;
        if (jobId) {
            return {
                success: true,
                message: "CronJob creado correctamente en la nube",
                data: jobId
            };
        }
        else {
            return {
                success: false,
                message: `No se pudo crear el CronJob en la nube (No se recibió el jobId): ${data}`,
                data: null
            };
        }
    }
    catch (err) {
        const message = err instanceof Error ? "ERROR: " + err.message : "ERROR: " + err;
        return {
            success: false,
            message: message,
            data: null
        };
    }
});
exports.createCronJob = createCronJob;
const updateCronJob = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.CRON_API_KEY || !environment_1.JWT2_SECRET)
            throw new Error("Error interno del servidor, variable de entorno para actualización de CronJob no disponible");
        const token = jsonwebtoken_1.default.sign({ userEmail: options.userEmail }, environment_1.JWT2_SECRET, { expiresIn: "72h" });
        const { mdays, months, hours, minutes, wdays } = (0, utils_1.calculateFutureDateInHours)(environment_1.CART_REMINDER_WAIT_IN_HOURS);
        const response = yield fetch(`https://api.cron-job.org/jobs/${options.cronJobId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${environment_1.CRON_API_KEY}`
            },
            body: JSON.stringify({
                job: {
                    url: `https://almacendejoyasapi.vercel.app/api/usersNotifications/sendCartReminderMail?token=${token}`,
                    schedule: { "timezone": "America/Argentina/Buenos_Aires", "expiresAt": 0, "hours": [hours], "mdays": [mdays], "minutes": [minutes], "months": [months], "wdays": [wdays] }
                }
            })
        });
        const data = yield response.json();
        if (typeof data === "object") { //Si todo sale bien recibimos un objeto vacio {}
            return {
                success: true,
                message: "Cron job actualizado correctamente",
                data: data
            };
        }
        else {
            return {
                success: false,
                message: `No se pudo actualizar el Cron job: ${JSON.stringify(data)}`,
                data: null
            };
        }
    }
    catch (err) {
        const message = err instanceof Error ? "ERROR: " + err.message : "ERROR: " + err;
        return {
            success: false,
            message: message,
            data: null
        };
    }
});
exports.updateCronJob = updateCronJob;
const deleteCronJob = (options) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.CRON_API_KEY)
            throw new Error("Error interno del servidor, variable de entorno para eliminación de CronJob no disponible");
        const response = yield fetch(`https://api.cron-job.org/jobs/${options.cronJobId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${environment_1.CRON_API_KEY}`
            }
        });
        const data = yield response.json();
        if (typeof data === "object") { //Si todo sale bien recibimos un objeto vacio {}
            return {
                success: true,
                message: "Cron job eliminado correctamente",
                data: data
            };
        }
        else {
            return {
                success: false,
                message: `No se pudo eliminar el Cron job: ${JSON.stringify(data)}`,
                data: null
            };
        }
    }
    catch (err) {
        const message = err instanceof Error ? "ERROR: " + err.message : "ERROR: " + err;
        return {
            success: false,
            message: message,
            data: null
        };
    }
});
exports.deleteCronJob = deleteCronJob;
//# sourceMappingURL=cron.js.map