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
exports.createStreamChatChannel = exports.getStreamChatToken = void 0;
const stream_chat_1 = require("stream-chat");
const environment_1 = require("../environment");
const getStreamChatToken = (data) => {
    try {
        if (!environment_1.GETSTREAM_API_KEY || !environment_1.GETSTREAM_SECRET || !environment_1.GETSTREAM_APP_ID)
            throw new Error("No se puedieron obtener las variables de entorno del servicio de streamChat");
        const serverClient = stream_chat_1.StreamChat.getInstance(environment_1.GETSTREAM_API_KEY, environment_1.GETSTREAM_SECRET);
        const token = serverClient.createToken(data.userId);
        return token;
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        return "";
    }
};
exports.getStreamChatToken = getStreamChatToken;
const createStreamChatChannel = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!environment_1.GETSTREAM_API_KEY || !environment_1.GETSTREAM_SECRET || !environment_1.GETSTREAM_APP_ID)
            throw new Error("No se puedieron obtener las variables de entorno del servicio de streamChat");
        const serverClient = stream_chat_1.StreamChat.getInstance(environment_1.GETSTREAM_API_KEY, environment_1.GETSTREAM_SECRET);
        const botUserId1 = "bot_user1"; //Creamos 2 usuarios ficticios ya que el canal necesita como minimo 2 usuarios para funcionar
        yield serverClient.upsertUser({
            id: botUserId1,
            name: "Bot User 1",
        });
        const botUserId2 = "bot_user2";
        yield serverClient.upsertUser({
            id: botUserId2,
            name: "Bot User 1",
        });
        const channel = serverClient.channel("global", "notifications", { created_by_id: "bot_user1" });
        yield channel.create();
        return;
    }
    catch (err) {
        console.error(err instanceof Error ? err.message : err);
        return null;
    }
});
exports.createStreamChatChannel = createStreamChatChannel;
//# sourceMappingURL=getStream.js.map