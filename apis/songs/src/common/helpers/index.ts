import { ServiceProvider } from '../types/service-provider';
import { SongsService } from '../services/songs';
import { Environment } from '../environments/environment';

const env = process.env.NODE_ENV;
const environment: Environment = require(`../environments/environment.${env}.ts`).default;

let services: ServiceProvider;
export function makeServiceProvider(): ServiceProvider {
    if (!services) {
        services = {
            songs: new SongsService({
                eamusement: environment.eamusement
            })
        };
    }

    return services;
}

export function toEAmusementUrl(eamusementUrl: string, relativeUrl: string): string {
    return `${eamusementUrl}${relativeUrl}`;
}

export function isString(value: string | object): value is string {
    return typeof value === 'string';
}