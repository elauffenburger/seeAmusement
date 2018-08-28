import { APIGatewayEvent, Context, Callback, Handler } from 'aws-lambda';

import { GetAllSongsArgs } from '../common/services/songs';
import { makeServiceProvider } from '../common/helpers';

const services = makeServiceProvider();
export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const args: GetAllSongsArgs = JSON.parse(event.body);

    const songs = await services.songs.getAll(args);

    callback(null, songs);
};