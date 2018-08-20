import { Injectable } from '@angular/core';
import { InAppBrowser, InAppBrowserOptions, InAppBrowserObject, InAppBrowserEvent } from '@ionic-native/in-app-browser';
import { toEAmusementUrl } from '../../helpers';
import { SESSION_COOKIE_KEY, EAMUSEMENT_LOGIN_PATH, EAMUSEMENT_HOME_PATH } from '../../helpers/constants';
import { StringLookup } from '../../models/types';
import { Storage } from '@ionic/storage';

const CLEAR_CACHE = false;

const SESSION_STORAGE_KEY = 'SessionKey';

@Injectable()
export class SessionProvider {
  constructor(private storage: Storage, private browser: InAppBrowser) { }

  set(value: string): Promise<any> {
    return this.storage.set(SESSION_STORAGE_KEY, value);
  }

  get(): Promise<string> {
    return this.storage.get(SESSION_STORAGE_KEY);
  }

  async login(): Promise<string> {
    // Ask the user to create a new one and save it
    const session = await this.createNewSession();

    this.set(session);

    return session;
  }

  createNewSession(): Promise<string> {
    return new Promise((res, rej) => {
      const shouldClearCache = CLEAR_CACHE ? 'yes' : null;

      const browserOptions: InAppBrowserOptions = {
        clearcache: shouldClearCache,
        clearsessioncache: shouldClearCache
      };

      const browser = this.browser.create(toEAmusementUrl(EAMUSEMENT_LOGIN_PATH), null, browserOptions);

      // Try to get the session cookie
      let session: string;
      browser.on('loadstop')
        .subscribe(async event => {
          console.log('loadstop fired!');

          const cookies = await this.getBrowserCookies(browser);

          const sessionCookie = this.getSessionCookie(cookies);
          const isLoggedIn = this.verifyUserIsLoggedIn(event);

          console.log('sessionCookie: ', sessionCookie);
          console.log('isLoggedIn: ', isLoggedIn);

          if (!sessionCookie || !isLoggedIn) {
            return;
          }

          session = sessionCookie;
          browser.close();
        });

      // Wait until the window is closed
      browser.on('exit')
        .subscribe(ev => {
          res(session);
        });
    });
  }

  verifyUserIsLoggedIn(event: InAppBrowserEvent): boolean {
    const homeUrl = toEAmusementUrl(EAMUSEMENT_HOME_PATH);

    console.log(JSON.stringify(event));
    console.log(homeUrl);

    return event.url.startsWith(homeUrl);
  }

  getBrowserCookies(browser: InAppBrowserObject): Promise<StringLookup<string>> {
    return browser.executeScript({ code: 'document.cookie' })
      .then((values: string[]) => {
        const cookie = values[0];

        return cookie.split(';')
          .reduce((acc, cookieValue: string) => {
            const kvp = cookieValue.trim().split('=');

            const key = kvp[0];
            const value = kvp[1];

            acc[key] = value;

            return acc;
          }, {});
      });
  }

  getSessionCookie(cookies: StringLookup<string>): string {
    return cookies && cookies[SESSION_COOKIE_KEY];
  }
}
