import { MyApp } from "../app/app.component";

export interface Environment {
    apiUrl: string,
    eamusement: {
        url: string,
        serverId: number,
        sessionCookieKey: string,
    },
    onLoad?: (app: MyApp) => Promise<any>
}

export const environment: Environment = {
    apiUrl: '',
    eamusement: {
        url: 'https://p.eagate.573.jp',
        serverId: 573,
        sessionCookieKey: 'M573SSID'
    }
}

export default environment;