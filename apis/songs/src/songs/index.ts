import { Handler, APIGatewayEvent } from 'aws-lambda';
import AWS from 'aws-sdk';

import getAll from './apis/get-all';
import getRecentlyPlayed from './apis/get-recently-played';
import { ServiceProvider } from './types/service-provider';
import { SongsService } from '../common/services/songs';
import { Environment } from './environments/environment';

const env = process.env.NODE_ENV;

const environment: Environment = require(`./environments/environment.${env}.json`);

let services: ServiceProvider;
function makeServiceProvider(): ServiceProvider {
    if (!services) {
        services = {
            songs: new SongsService({
                eamusement: environment.eamusement
            })
        };
    }

    return services;
}

export const handler: Handler = (event: APIGatewayEvent, context, callback) => {
    const services = makeServiceProvider();

    switch (event.path) {
        case 'all':
            getAll(services, event, context, callback);
        case 'recently-played':
            getRecentlyPlayed(services, event, context, callback);
    }
};