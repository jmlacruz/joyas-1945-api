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
exports.updateGoogleReviews = void 0;
const dao_1 = require("../dao");
const environment_1 = require("../environment");
const customError_1 = require("../types/customError");
const getReviewspage = (next_page_token) => __awaiter(void 0, void 0, void 0, function* () {
    const url = `https://serpapi.com/search?engine=google_maps_reviews&place_id=${environment_1.GOOGLE_PLACE_ID}&api_key=${environment_1.API_GOOGLE_REVIEWS_API_KEY}&sort_by=newestFirst${next_page_token ? "&next_page_token=" + next_page_token : ""}`;
    const response = yield fetch(url, {
        method: "GET",
    });
    const data = yield response.json();
    return data;
});
const updateGoogleReviews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!environment_1.API_GOOGLE_REVIEWS_API_KEY)
            throw new Error("Error interno del servidor. Variable de entorno 'API_GOOGLE_REVIEWS_API_KEY' para obtención de reviews de google no disponible - (getReviews)");
        if (!environment_1.GOOGLE_PLACE_ID)
            throw new Error("Error interno del servidor. Variable de entorno 'GOOGLE_PLACE_ID' para obtención de reviews de google no disponible - (getReviews)");
        let reviews = [];
        let next_page_token = "";
        let reviewsPage = null;
        do {
            reviewsPage = yield getReviewspage(next_page_token); //Se obtienen todas las reviews de google pagina por pagina (La API no las muestra todas juntas)
            reviews = reviews.concat(reviewsPage.reviews);
            next_page_token = ((_a = reviewsPage.serpapi_pagination) === null || _a === void 0 ? void 0 : _a.next_page_token) || ""; //Cuando aparece el campo "next_page_token" es por que hay una o mas paginas por mostrar
        } while (next_page_token);
        const reviewsForDB = reviews.map((review) => {
            const createdTimestamp = (new Date(review.iso_date)).getTime() / 1000;
            return {
                author_name: review.user.name,
                author_url: review.user.link,
                profile_photo_url: review.user.thumbnail,
                language: "es",
                rating: review.rating,
                relative_time_description: review.date,
                text: review.snippet ? review.snippet.replace(/[^\x20-\x7EáéíóúÁÉÍÓÚñÑüÜ]/g, "") : "", //Elimina caracteres no imprimibles (como Emojis), si no, ocurre un error cuando viene un caracter no estandar
                time: createdTimestamp,
                added: Date.now() / 1000,
                control: `${review.user.name}-${createdTimestamp}`,
                show: "0",
            };
        });
        const fields = ["author_name", "time"];
        const response = yield (0, dao_1.getDao)().getTable({ tableName: "reviews", fields });
        if (!response.success || !response.data)
            throw new Error(`Error al obtener las reviews de la base de datos: ${response.message} - (getReviews)`);
        const reviewsFromDB = response.data;
        const reviewsToInsert = reviewsForDB.filter((reviewForDB) => !reviewsFromDB.some((reviewFromDB) => reviewFromDB.author_name === reviewForDB.author_name && reviewFromDB.time === reviewForDB.time)); //Solamente insertamos la review si no exite una con el mismo nombre y mismo timestamp 
        reviewsToInsert.sort((a, b) => b.time - a.time);
        if (reviewsToInsert.length > 0) {
            const response2 = yield (0, dao_1.getDao)().insertRow({ tableName: "reviews", data: reviewsToInsert });
            if (!response2.success)
                throw new Error(`Error al insertar las nuevas reviews en la base de datos: ${response2.message} - (getReviews)`);
        }
        res.status(200).json({ success: true, data: reviewsForDB, message: "Reviews obtenidas correctamente" });
    }
    catch (err) {
        const message = err instanceof Error || err instanceof customError_1.CustomError ? "ERROR: " + err.message : "ERROR: " + err;
        const status = err instanceof customError_1.CustomError ? err.status : 500;
        res.status(status).json({ success: false, data: null, message: message });
    }
});
exports.updateGoogleReviews = updateGoogleReviews;
//# sourceMappingURL=googleReviews.js.map