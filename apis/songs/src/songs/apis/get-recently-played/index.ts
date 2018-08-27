import { Context, APIGatewayEvent, Callback } from 'aws-lambda';
import { ServiceProvider } from '../../types/service-provider';

const handler = async (services: ServiceProvider, event: APIGatewayEvent, context: Context, callback: Callback) => {
    const body = JSON.parse(event.body) as {
        sessionKey: string;
    };

    const sessionKey = body.sessionKey;
    const songs = await services.songs.getRecentlyPlayed(sessionKey);

    callback(null, songs);
};

export default handler;