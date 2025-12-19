import { Request, Response } from "express";
import { CustomError } from "../types/customError";
import { LogControllers_CustomResponse, Review } from "../types/types";
import { SERPAPI_GOOGLE_REVIEWS_API_KEY, ADJ_GOOGLE_PLACE_ID } from "../environment";
import { ReviewFromGoogle, SerpApiResponse } from "../types/googleReviews";
import { getDao } from "../dao";

const getReviewspage = async (next_page_token: string) => {
    const url = `https://serpapi.com/search?engine=google_maps_reviews&place_id=${ADJ_GOOGLE_PLACE_ID}&api_key=${SERPAPI_GOOGLE_REVIEWS_API_KEY}&sort_by=newestFirst${next_page_token ? "&next_page_token=" + next_page_token : ""}`;

    const response = await fetch(url, {
        method: "GET",
    });

    const data: SerpApiResponse = await response.json();
    return data;
};

export const updateGoogleReviews = async (req: Request, res: Response) => {
    try {
        if (!SERPAPI_GOOGLE_REVIEWS_API_KEY) throw new Error ("Error interno del servidor. Variable de entorno 'SERPAPI_GOOGLE_REVIEWS_API_KEY' para obtención de reviews de google no disponible - (getReviews)"); 
        if (!ADJ_GOOGLE_PLACE_ID) throw new Error ("Error interno del servidor. Variable de entorno 'ADJ_GOOGLE_PLACE_ID' para obtención de reviews de google no disponible - (getReviews)");
             
        let reviews: ReviewFromGoogle[] = [];
        let next_page_token: string = "";
        let reviewsPage: SerpApiResponse | null = null;

        do {
            reviewsPage = await getReviewspage(next_page_token);                                         //Se obtienen todas las reviews de google pagina por pagina (La API no las muestra todas juntas)
            reviews = reviews.concat(reviewsPage.reviews);                                          
            next_page_token = reviewsPage.serpapi_pagination?.next_page_token || "";                     //Cuando aparece el campo "next_page_token" es por que hay una o mas paginas por mostrar
        } while (next_page_token);

        const reviewsForDB: Review[] = reviews.map((review) => {                                         //Llevamos los datos al formato que requiere la base de datos
            const createdTimestamp = (new Date(review.iso_date)).getTime() / 1000;

            return {
                author_name: review.user.name,
                author_url: review.user.link,
                profile_photo_url: review.user.thumbnail,
                language: "es",
                rating: review.rating,
                relative_time_description: review.date,
                text: review.snippet ? review.snippet.replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜ]/g, "") : "",   //Elimina caracteres no imprimibles (como Emojis), si no, ocurre un error cuando viene un caracter no estandar
                time: createdTimestamp,
                added: Date.now() / 1000,
                control: `${review.user.name}-${createdTimestamp}`,
                show: "0" as "0" | "1",
            };
        });

        const fields: (keyof Review)[] = ["author_name", "time"];
        const response = await getDao().getTable({tableName: "reviews", fields});
        if (!response.success || !response.data) throw new Error(`Error al obtener las reviews de la base de datos: ${response.message} - (getReviews)`);
        const reviewsFromDB: Review[] = response.data;
        const reviewsToInsert = reviewsForDB.filter((reviewForDB) => !reviewsFromDB.some((reviewFromDB) => reviewFromDB.author_name === reviewForDB.author_name && reviewFromDB.time === reviewForDB.time));  //Solamente insertamos la review si no exite una con el mismo nombre y mismo timestamp 
        reviewsToInsert.sort((a, b) => b.time - a.time);

        if (reviewsToInsert.length > 0) {
            const response2 = await getDao().insertRow({tableName: "reviews", data: reviewsToInsert});
            if (!response2.success) throw new Error(`Error al insertar las nuevas reviews en la base de datos: ${response2.message} - (getReviews)`);
        }

        res.status(200).json({success: true, data: reviewsForDB, message: "Reviews obtenidas correctamente"} as LogControllers_CustomResponse);
    } catch (err) {
        const message = err instanceof Error || err instanceof CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof CustomError ? err.status : 500;
        res.status(status).json({success: false, data: null, message: message} as LogControllers_CustomResponse);
    }
};   


