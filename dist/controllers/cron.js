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
exports.checkCart = void 0;
const customError_1 = require("../types/customError");
const dao_1 = require("../dao");
const cron_1 = require("../services/cron");
const environment_1 = require("../environment");
const checkCart = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userEmail } = req.query;
        if (!userEmail || typeof userEmail !== "string")
            throw new customError_1.CustomError("Email no válido", 400);
        const response = yield (0, dao_1.getDao)().getCart({ userEmail: userEmail });
        if (response.success && response.data.length) {
            const cartData = response.data;
            const cartJSON = cartData[0].cart;
            const cartOBJ = JSON.parse(cartJSON);
            const isEmptyCart = !cartOBJ.length;
            const { cronJobId } = cartData[0];
            if (isEmptyCart && !cronJobId) {
                res.status(200).json({ success: true }); //Carrito vacío y sin tarea cron asignada
            }
            else if (!isEmptyCart) {
                if (!cronJobId) {
                    const response2 = yield (0, cron_1.createCronJob)({ userEmail }); //Se crea CronJob en la nube
                    if (response2.success) {
                        const cronJob_id = response2.data;
                        const response3 = yield (0, dao_1.getDao)().updateCart({ condition: { field: "userEmail", value: userEmail }, data: { cronJobId: cronJob_id } }); //Se setea el ID del CronJob en el carrito en la base de datos
                        if (response3.success) {
                            const message = `SE creó CronJob en la nube (${environment_1.CART_REMINDER_WAIT_IN_HOURS}hs) y CronJob Id en la base de datos`;
                            console.info(message);
                            res.status(200).json({ success: true, message: message });
                        }
                        else {
                            const message = `SE creó CronJob en la nube (${environment_1.CART_REMINDER_WAIT_IN_HOURS}hs) - NO se pudo crear CronJob Id en la base de datos`;
                            console.error(message);
                            res.status(500).json({ success: false, message: message });
                        }
                    }
                    else {
                        const message = `NO se pudo crear el CronJob en la nube: ${response2.message} - NO se intentó crear el CronJob Id en la base de datos`;
                        console.error(message);
                        res.status(500).json({ success: false, message: message });
                    }
                }
                else {
                    const response4 = yield (0, cron_1.updateCronJob)({ cronJobId, userEmail }); //Se actualiza el CronJob en la nube
                    if (response4.success) {
                        const response5 = yield (0, dao_1.getDao)().updateCart({ condition: { field: "userEmail", value: userEmail }, data: { cronJobId: cronJobId } }); //Se actualiza el CronJob Id en la base de datos
                        if (response5.success && response5.data) {
                            console.info(`SE actualizó CronJob en la nube (${environment_1.CART_REMINDER_WAIT_IN_HOURS}hs) y CronJob Id en la base de datos`);
                            res.status(200).json({ success: true, message: response.message });
                        }
                        else {
                            const message = "SE actualizó el CronJob en la nube - NO se pudo actualizar el CronJob Id en la base de datos";
                            console.error(message);
                            res.status(200).json({ success: true, message: message });
                        }
                    }
                    else {
                        const message = `NO se pudo actualizar el Cron Job en la nube: ${response4.message} - NO se intentó actualizar el CronJob Id en la base de datos`;
                        console.error(message);
                        res.status(500).json({ success: false, message: message });
                    }
                }
            }
            else if (isEmptyCart && cronJobId) {
                const response6 = yield (0, cron_1.deleteCronJob)({ cronJobId }); //Eliminamos CronJob de la nube
                if (response6.success) {
                    const response7 = yield (0, dao_1.getDao)().updateCart({ condition: { field: "userEmail", value: userEmail }, data: { cronJobId: null } }); //Eliminamos el Cron Job Id de la base de datos
                    if (response7.success) {
                        const message = "CronJob eliminado de la nube y CronJob Id eliminado de la base de datos";
                        console.info(message);
                        res.status(200).json({ success: true, message: message });
                    }
                    else {
                        const message = "SE eliminó el Cron Job de la nube - NO se pudo eliminar el CronJob Id de la base de datos";
                        console.error(message);
                        res.status(200).json({ success: true, message: message });
                    }
                }
                else {
                    const message = `NO se pudo eliminar el Cron Job de la nube: ${response6.message} - NO se intentó eliminar el CronJob Id de la base de datos`;
                    console.error(message);
                    res.status(500).json({ success: false, message: message });
                }
            }
        }
        else {
            const message = "NO se encontró el carrito en la base de datos - NO se intentó crear el CronJob en la nube ni el CrobJob Id en la base de datos";
            console.error(message);
            res.status(200).json({ success: true, message: message });
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
exports.checkCart = checkCart;
//# sourceMappingURL=cron.js.map