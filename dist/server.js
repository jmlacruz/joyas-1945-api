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
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const dao_1 = require("./dao");
const environment_1 = require("./environment");
const routes_1 = __importDefault(require("./routes/routes"));
const utils_1 = require("./utils/utils");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: environment_1.CORS_ALLOW_ORIGINS, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use("/api", routes_1.default);
const PORT = process.env.PORT || 8080;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, dao_1.getDao)().connect();
    if (response.success) {
        const response1 = yield (0, dao_1.getDao)().createUsersLogTableIfNotExits();
        (0, utils_1.printInitialActionsResponse)(response1);
        const response2 = yield (0, dao_1.getDao)().createNotificationsLogTableIfNotExits();
        (0, utils_1.printInitialActionsResponse)(response2);
        const response3 = yield (0, dao_1.getDao)().createCartsTableIfNotExits();
        (0, utils_1.printInitialActionsResponse)(response3);
        const response4 = yield (0, dao_1.getDao)().createProductsHabDesTableLogs();
        (0, utils_1.printInitialActionsResponse)(response4);
        yield (0, dao_1.getDao)().insertColumnIfNotExists({ tableName: "log", columnName: "origen", columnType: "TEXT" });
        yield (0, dao_1.getDao)().insertColumnIfNotExists({ tableName: "pedidos", columnName: "printedqty", columnType: "INT" });
        yield (0, dao_1.getDao)().insertColumnIfNotExists({ tableName: "usuario", columnName: "last_activity_at", columnType: "DATETIME" });
    }
    app.listen(PORT, () => console.log(`Server UP in Port ${PORT}`));
    console.log(response.message);
}))();
//# sourceMappingURL=server.js.map