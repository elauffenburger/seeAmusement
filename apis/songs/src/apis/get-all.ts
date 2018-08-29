import { APIGatewayEvent, Context, Callback, Handler } from 'aws-lambda';

import { GetAllSongsArgs } from '../common/services/songs';
import { makeServiceProvider, isString } from '../common/helpers';

const services = makeServiceProvider();
export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const args: GetAllSongsArgs = isString(event.body)
        ? JSON.parse(event.body)
        : event.body;

    return await services.songs.getAll(args);
};