import { APIGatewayEvent, Context, Callback, Handler } from 'aws-lambda';

import { makeServiceProvider } from '../common/helpers';

const services = makeServiceProvider();
export const handler: Handler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    return await services.songs.getMetadata(false);
};