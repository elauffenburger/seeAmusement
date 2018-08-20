import { Injectable } from '@angular/core';
import { SessionProvider } from '../session/session';
import { Song } from '../../models';
import { toEAmusementUrl } from '../../helpers';
import { StringLookup } from '../../models/types';
import { EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH } from '../../helpers/constants';
import { HTTP } from '@ionic-native/http';

import { environment } from '@app/env';

@Injectable()
export class SongsProvider {
  constructor(public http: HTTP, private session: SessionProvider) { }

  async getRecentlyPlayed(): Promise<Song[]> {
    const url = toEAmusementUrl(EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH);

    try {
      this.http.setCookie(environment.eamusement.url, await this.getSessionCookie());
      const response = await this.http.get(url, {}, {});

      if (response.error) {
        console.log('something went wrong fetching recently played!')

        // TODO: error handling
        throw JSON.stringify(response.error);
      }

      const html = response.data;
      const dom = new DOMParser().parseFromString(html, 'text/html');

      return (<HTMLElement[]>Array.apply(null, dom.querySelectorAll(`table#data_tbl tbody tr`)))
        .slice(1)
        .map((row: HTMLElement) => {
          const columns: HTMLElement[] = Array.apply(null, row.querySelectorAll('td'));

          const song: Song = {
            title: columns[0].querySelector('a').textContent,
            thumbnailUrl: this.mungSongImageUrl(columns[0].querySelector('img').src),
            difficulty: columns[1].textContent,
            ratingThumbnailUrl: this.mungSongImageUrl(columns[2].querySelector('img').src),
            score: columns[3].textContent,
            timestamp: columns[4].textContent
          };

          return song;
        });
    } catch (e) {
      console.log('something went critically wrong fetching recently played!')

      // TODO: error handling
      throw JSON.stringify(e);
    }
  }

  async getSessionCookie(): Promise<string> {
    return `${environment.eamusement.sessionCookieKey}=${await this.session.get()}`;
  }

  mungSongImageUrl(absoluteUrl: string): string {
    const url = new URL(absoluteUrl);
    url.searchParams.set('kind', '1');

    return `${toEAmusementUrl(url.pathname)}${url.search}`
  }
}
