import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { getDao } from "./dao";
import { CORS_ALLOW_ORIGINS } from "./environment";
import routes from "./routes/routes";
import { createStreamChatChannel } from "./services/getStream";
import { printInitialActionsResponse } from "./utils/utils";

const app = express();

app.use(cors({ origin: CORS_ALLOW_ORIGINS, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use("/api", routes);

const PORT = process.env.PORT || 8080;

(async () => {
    createStreamChatChannel();
    
    
    const response = await getDao().connect();
    if (response.success) {
        const response1 = await getDao().createUsersLogTableIfNotExits();
        printInitialActionsResponse(response1);
        const response2 = await getDao().createNotificationsLogTableIfNotExits();
        printInitialActionsResponse(response2);
        const response3 = await getDao().createCartsTableIfNotExits();
        printInitialActionsResponse(response3);
        const response4 = await getDao().createProductsHabDesTableLogs();
        printInitialActionsResponse(response4);
        await getDao().insertColumnIfNotExists({ tableName: "log", columnName: "origen", columnType: "TEXT" });
        await getDao().insertColumnIfNotExists({ tableName: "pedidos", columnName: "printedqty", columnType: "INT" });
        await getDao().insertColumnIfNotExists({ tableName: "usuario", columnName: "last_activity_at", columnType: "DATETIME" });
    }
    app.listen(PORT, () => console.log(`Server UP in Port ${PORT}`));
    console.log(response.message);
})();