import { Context, APIGatewayEvent, Callback, Handler } from 'aws-lambda';
import { makeServiceProvider, isString } from '../common/helpers';

const services = makeServiceProvider();
export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const body: { sessionKey: string; } = isString(event.body)
        ? JSON.parse(event.body)
        : event.body;

    const sessionKey = body.sessionKey;
    return await services.songs.getRecentlyPlayed(sessionKey);
};