import { APIGatewayEvent, Context, Callback } from 'aws-lambda';

import { ServiceProvider } from '../../types/service-provider';
import { GetAllSongsArgs } from '../../../common/services/songs';

const handler = async (services: ServiceProvider, event: APIGatewayEvent, context: Context, callback: Callback) => {
    const args: GetAllSongsArgs = JSON.parse(event.body);

    const songs = await services.songs.getAll(args);

    callback(null, songs);
};

export default handler;