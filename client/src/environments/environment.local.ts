import { Environment } from "./environment";
import { Storage } from "@ionic/storage";
import { SessionProvider } from "../providers/session/session";
import { SongsProvider } from "../providers/songs/songs";

export const environment: Environment = {
    apiUrl: 'http://192.168.7.135:3000',
    eamusement: {
        url: 'https://p.eagate.573.jp',
        serverId: 573,
        sessionCookieKey: 'M573SSID'
    },
    onLoad: async app => {
        const services = {
            storage: app.injector.get(Storage),
            session: app.injector.get(SessionProvider),
            songs: app.injector.get(SongsProvider)
        };

        services.session.set('ab36c633-566f-4c6d-b2b4-df45deabbca3');

        // Set up debug services on window
        (<any>window).services = services;
    }
}