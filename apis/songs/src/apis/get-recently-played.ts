import { Context, APIGatewayEvent, Callback, Handler } from 'aws-lambda';
import { makeServiceProvider } from '../common/helpers';

const services = makeServiceProvider();
const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const body = JSON.parse(event.body) as {
        sessionKey: string;
    };

    const sessionKey = body.sessionKey;
    const songs = await services.songs.getRecentlyPlayed(sessionKey);

    callback(null, songs);
};

export default handler;