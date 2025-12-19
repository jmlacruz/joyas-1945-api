import { StreamChat } from "stream-chat";
import { GETSTREAM_API_KEY, GETSTREAM_APP_ID, GETSTREAM_SECRET } from "../environment";

export const getStreamChatToken = (data: {userId: string}) => {
    try {
        if (!GETSTREAM_API_KEY || !GETSTREAM_SECRET || !GETSTREAM_APP_ID) throw new Error("No se puedieron obtener las variables de entorno del servicio de streamChat");
        const serverClient = StreamChat.getInstance( GETSTREAM_API_KEY, GETSTREAM_SECRET);
        const token = serverClient.createToken(data.userId);
        return token;
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        return "";
    }
};

export const createStreamChatChannel = async () => {
    try {
        if (!GETSTREAM_API_KEY || !GETSTREAM_SECRET || !GETSTREAM_APP_ID) throw new Error("No se puedieron obtener las variables de entorno del servicio de streamChat");
        const serverClient = StreamChat.getInstance(GETSTREAM_API_KEY, GETSTREAM_SECRET);

        const botUserId1 = "bot_user1";                                                 //Creamos 2 usuarios ficticios ya que el canal necesita como minimo 2 usuarios para funcionar
        await serverClient.upsertUser({
            id: botUserId1,
            name: "Bot User 1",
        });

        const botUserId2 = "bot_user2";
        await serverClient.upsertUser({
            id: botUserId2,
            name: "Bot User 1",
        });

        const channel = serverClient.channel("global", "notifications", {created_by_id: "bot_user1"});
        await channel.create();
          
        return;
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        return null;
    }
};


