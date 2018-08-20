import { Environment } from "./environment";
import { Storage } from "@ionic/storage";
import { SessionProvider } from "../providers/session/session";
import { SongsProvider } from "../providers/songs/songs";
import { RecentlyPlayedPage } from "../pages/recently-played/recently-played";

const FORCED_SESSION_ID = '001fc1c6-b657-4319-970a-dd17463e493f';

export const environment: Environment = {
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

        // Set up debug services on window
        (<any>window).services = services;

        // Fake a session
        services.session.set(FORCED_SESSION_ID);

        // Nav to RecentlyPlayed
        app.nav.setRoot(RecentlyPlayedPage);
    }
}