import jwt from "jsonwebtoken";
import { CRON_API_KEY, JWT2_SECRET, CART_REMINDER_WAIT_IN_HOURS } from "../environment";
import { FunctionsCustomResponse } from "../types/types";
import { calculateFutureDateInHours } from "../utils/utils";

export const createCronJob = async (options: {userEmail: string}): Promise<FunctionsCustomResponse> => {
    try {

        if (!JWT2_SECRET || !CRON_API_KEY) throw new Error("Error interno del servidor, variable para creación de CronJob no disponible");
        const token = jwt.sign({userEmail: options.userEmail}, JWT2_SECRET, {expiresIn: "72h"});
        const {mdays, months, hours, minutes, wdays} = calculateFutureDateInHours(CART_REMINDER_WAIT_IN_HOURS);

        const response = await fetch("https://api.cron-job.org/jobs", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CRON_API_KEY}`
            },
            body: JSON.stringify({
                job: {
                    url: `https://almacendejoyasapi.vercel.app/api/usersNotifications/sendCartReminderMail?token=${token}`,
                    enabled: "true",
                    saveResponses: true,
                    schedule: { "timezone": "America/Argentina/Buenos_Aires", "expiresAt": 0, "hours": [hours], "mdays": [mdays], "minutes": [minutes], "months": [months], "wdays": [wdays] },
                    requestMethod: 0                                                                //0 corresponde a get
                }
            })
        });
        const data = await response.json();
        const jobId = data.jobId;
        if (jobId) {
            return {
                success: true,
                message: "CronJob creado correctamente en la nube",
                data: jobId
            };
        } else {
            return {
                success: false,
                message: `No se pudo crear el CronJob en la nube (No se recibió el jobId): ${data}`,
                data: null
            };
        }

    } catch (err) {
        const message = err instanceof Error ? "ERROR: " + err.message : "ERROR: " + err;
        return {
            success: false,
            message: message,
            data: null
        };
    }
};

export const updateCronJob = async (options: {cronJobId: number, userEmail: string}): Promise<FunctionsCustomResponse> => {
    try {

        if (!CRON_API_KEY || !JWT2_SECRET) throw new Error("Error interno del servidor, variable de entorno para actualización de CronJob no disponible");
        const token = jwt.sign({userEmail: options.userEmail}, JWT2_SECRET, {expiresIn: "72h"});
        const {mdays, months, hours, minutes, wdays} = calculateFutureDateInHours(CART_REMINDER_WAIT_IN_HOURS);

        const response = await fetch(`https://api.cron-job.org/jobs/${options.cronJobId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CRON_API_KEY}`
            },
            body: JSON.stringify({
                job: {
                    url: `https://almacendejoyasapi.vercel.app/api/usersNotifications/sendCartReminderMail?token=${token}`,
                    schedule: { "timezone": "America/Argentina/Buenos_Aires", "expiresAt": 0, "hours": [hours], "mdays": [mdays], "minutes": [minutes], "months": [months], "wdays": [wdays] }
                }
            })
        });
        const data = await response.json();
        if (typeof data === "object") {                             //Si todo sale bien recibimos un objeto vacio {}
            return {
                success: true,
                message: "Cron job actualizado correctamente",
                data: data
            };
        } else {
            return {
                success: false,
                message: `No se pudo actualizar el Cron job: ${JSON.stringify(data)}`,
                data: null
            };
        }

    } catch (err) {
        const message = err instanceof Error ? "ERROR: " + err.message : "ERROR: " + err;
        return {
            success: false,
            message: message,
            data: null
        };
    }
};

export const deleteCronJob = async (options: {cronJobId: number}): Promise<FunctionsCustomResponse> => {
    try {

        if (!CRON_API_KEY) throw new Error("Error interno del servidor, variable de entorno para eliminación de CronJob no disponible");

        const response = await fetch(`https://api.cron-job.org/jobs/${options.cronJobId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${CRON_API_KEY}`
            }
        });
        const data = await response.json();
        if (typeof data === "object") {                             //Si todo sale bien recibimos un objeto vacio {}
            return {
                success: true,
                message: "Cron job eliminado correctamente",
                data: data
            };
        } else {
            return {
                success: false,
                message: `No se pudo eliminar el Cron job: ${JSON.stringify(data)}`,
                data: null
            };
        }

    } catch (err) {
        const message = err instanceof Error ? "ERROR: " + err.message : "ERROR: " + err;
        return {
            success: false,
            message: message,
            data: null
        };
    }
};