import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SessionProvider } from '../session/session';
import { Song } from '../../models';
import { toEAmusementUrl } from '../../helpers';
import { StringLookup } from '../../models/types';
import 'rxjs/add/operator/map';
import { EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH, SESSION_COOKIE_KEY } from '../../helpers/constants';

@Injectable()
export class SongsProvider {
  constructor(public http: HttpClient, private session: SessionProvider) { }

  async getRecentlyPlayed(): Promise<Song[]> {
    const url = toEAmusementUrl(EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH);
    const headers = await this.makeAuthHeaders();

    console.log(url);
    console.log(headers);

    return new Promise<Song[]>((res, rej) => {
      this.http.get(url, headers)
        .map((html: string) => {
          console.log(html);
          const dom = new DOMParser().parseFromString(html, 'text/html');

          return (<HTMLElement[]>Array.apply(null, dom.querySelectorAll(`table#data_tbl tbody tr`)))
            .slice(1)
            .map((row: HTMLElement) => {
              const columns: HTMLElement[] = Array.apply(null, row.querySelectorAll('td'));

              const song: Song = {
                title: columns[0].querySelector('a font font').textContent,
                thumbnailUrl: columns[0].querySelector('img').src,
                difficulty: columns[1].querySelector('font font').textContent,
                ratingThumbnailUrl: columns[2].querySelector('img').src,
                score: columns[3].querySelector('font font').textContent,
                timestamp: columns[4].querySelector('font font').textContent
              };

              return song;
            });
        })
        .subscribe(songs => res(songs), error => {
          console.log(JSON.stringify(error));
        });
    });
  }

  async makeAuthHeaders(): Promise<StringLookup<string>> {
    return {
      Cookie: `${SESSION_COOKIE_KEY}=${await this.session.get()}`
    };
  }
}
