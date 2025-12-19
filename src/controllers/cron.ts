import {Request, Response} from "express";
import { CustomError } from "../types/customError";
import { getDao } from "../dao";
import { CartDataFromDB, DatabaseControllers_CustomResponse } from "../types/types";
import { createCronJob, deleteCronJob, updateCronJob } from "../services/cron";
import { CART_REMINDER_WAIT_IN_HOURS } from "../environment";

export const checkCart = async (req: Request, res: Response) => {

    try {
        const {userEmail} = req.query;
        if (!userEmail || typeof userEmail !== "string") throw new CustomError("Email no válido", 400);
  
        const response = await getDao().getCart({userEmail: userEmail});
        if (response.success && response.data.length) {
            const cartData: CartDataFromDB[] = response.data;
            const cartJSON = cartData[0].cart;
            const cartOBJ = JSON.parse(cartJSON);
            const isEmptyCart = !cartOBJ.length;
            const { cronJobId } = cartData[0];
            if (isEmptyCart && !cronJobId) {
                res.status(200).json({success: true} as DatabaseControllers_CustomResponse);                                                                    //Carrito vacío y sin tarea cron asignada
            } else if (!isEmptyCart) {
                if (!cronJobId) {
                    const response2 = await createCronJob({ userEmail });                                                                                       //Se crea CronJob en la nube
          
                    if (response2.success) {
                        const cronJob_id: number = response2.data;

                        const response3 = await getDao().updateCart({condition: {field: "userEmail", value: userEmail}, data: {cronJobId: cronJob_id}});        //Se setea el ID del CronJob en el carrito en la base de datos
                        if (response3.success ) {
                            const message = `SE creó CronJob en la nube (${CART_REMINDER_WAIT_IN_HOURS}hs) y CronJob Id en la base de datos`;
                            console.info(message);
                            res.status(200).json({success: true, message: message} as DatabaseControllers_CustomResponse);
                        } else {
                            const message = `SE creó CronJob en la nube (${CART_REMINDER_WAIT_IN_HOURS}hs) - NO se pudo crear CronJob Id en la base de datos`;
                            console.error(message);
                            res.status(500).json({success: false, message: message} as DatabaseControllers_CustomResponse);
                        }
                                            
                    } else {
                        const message = `NO se pudo crear el CronJob en la nube: ${response2.message} - NO se intentó crear el CronJob Id en la base de datos`;
                        console.error(message);
                        res.status(500).json({success: false, message: message} as DatabaseControllers_CustomResponse);
                    } 
                } else {                                                                                            
                    const response4 = await updateCronJob({ cronJobId, userEmail });                                                                                      //Se actualiza el CronJob en la nube
                    
                    if (response4.success) {
                        const response5 = await getDao().updateCart({condition: {field: "userEmail", value: userEmail}, data: {cronJobId: cronJobId}});                     //Se actualiza el CronJob Id en la base de datos
                        if (response5.success && response5.data) {
                            console.info(`SE actualizó CronJob en la nube (${CART_REMINDER_WAIT_IN_HOURS}hs) y CronJob Id en la base de datos`);
                            res.status(200).json({success: true, message: response.message} as DatabaseControllers_CustomResponse);
                        } else {
                            const message = "SE actualizó el CronJob en la nube - NO se pudo actualizar el CronJob Id en la base de datos";
                            console.error(message);
                            res.status(200).json({success: true, message: message} as DatabaseControllers_CustomResponse);
                        }
                    } else {
                        const message = `NO se pudo actualizar el Cron Job en la nube: ${response4.message} - NO se intentó actualizar el CronJob Id en la base de datos`;
                        console.error(message); 
                        res.status(500).json({success: false, message: message} as DatabaseControllers_CustomResponse);
                    }
                }
            } else if (isEmptyCart && cronJobId) {
                const response6 = await deleteCronJob({ cronJobId });                                                                                                       //Eliminamos CronJob de la nube
                if (response6.success) {
                    const response7 = await getDao().updateCart({condition: {field: "userEmail", value: userEmail}, data: {cronJobId: null}});                              //Eliminamos el Cron Job Id de la base de datos
                    if (response7.success) {
                        const message = "CronJob eliminado de la nube y CronJob Id eliminado de la base de datos";
                        console.info(message);
                        res.status(200).json({success: true, message: message} as DatabaseControllers_CustomResponse);
                    } else {
                        const message = "SE eliminó el Cron Job de la nube - NO se pudo eliminar el CronJob Id de la base de datos";
                        console.error(message); 
                        res.status(200).json({success: true, message: message} as DatabaseControllers_CustomResponse);
                    }
                } else {
                    const message = `NO se pudo eliminar el Cron Job de la nube: ${response6.message} - NO se intentó eliminar el CronJob Id de la base de datos`;
                    console.error(message);
                    res.status(500).json({success: false, message: message} as DatabaseControllers_CustomResponse);
                }
            }
        } else {
            const message = "NO se encontró el carrito en la base de datos - NO se intentó crear el CronJob en la nube ni el CrobJob Id en la base de datos";
            console.error(message);
            res.status(200).json({success: true, message: message} as DatabaseControllers_CustomResponse);
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