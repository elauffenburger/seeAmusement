import { Injectable, EventEmitter } from '@angular/core';
import { SessionProvider } from '../session/session';
import { Song, SongPlayInfo, SongType } from '../../models';
import { toEAmusementUrl } from '../../helpers';
import { EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH, EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH } from '../../helpers/constants';
import { HTTP, HTTPResponse } from '@ionic-native/http';

import { environment } from '@app/env';
import { Observer } from 'rxjs/Observer';

import _ from 'lodash';
import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';

export interface GetAllSongsArgs {
  type: SongType;
  getLatest: boolean;
  onProgress?: Observer<{ pageNum: number }>;
}

export interface GetSongsResponse {
  songs?: Song[],
  error?: 'no-auth' | 'unknown'
}

@Injectable()
export class SongsProvider {
  constructor(public http: HTTP, private session: SessionProvider, private storage: Storage) { }

  async getRecentlyPlayed(): Promise<GetSongsResponse> {
    const url = toEAmusementUrl(EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH);

    return this.tryGetSongs(url, async response => {
      const html = response.data;
      const dom = new DOMParser().parseFromString(html, 'text/html');

      const songs = (<HTMLElement[]>Array.apply(null, dom.querySelectorAll(`table#data_tbl tbody tr`)))
        .slice(1)
        .map((row: HTMLElement) => {
          const columns: HTMLElement[] = Array.apply(null, row.querySelectorAll('td'));

          const song: Song = {
            title: columns[0].querySelector('a').textContent,
            thumbnailUrl: this.mungSongImageUrl(columns[0].querySelector('img').src),
            playInfo: [
              {
                timestamp: columns[4].textContent,
                difficulty: {
                  difficulty: columns[1].textContent,
                  ratingThumbnailUrl: this.mungSongImageUrl(columns[2].querySelector('img').src),
                  score: columns[3].textContent,
                }
              }
            ]
          };

          return song;
        });

      return { songs };
    });
  }

  async getAll(args: GetAllSongsArgs): Promise<GetSongsResponse> {
    args.onProgress = args.onProgress || Observable.create();

    // If we need to get the latest or we haven't cached any song scores yet
    if (args.getLatest || !await this.hasCachedSongScores(args.type)) {
      const songs = await this.getLatestScores(args);
      this.cacheSongScores(args.type, songs);

      return songs;
    }

    return this.getCachedSongScores(args.type);
  }

  private async hasCachedSongScores(type: SongType): Promise<boolean> {
    return await this.storage.keys().then(keys => !!keys.find(key => key == this.getAllSongScoresCacheKeyForType(type)));
  }

  private cacheSongScores(type: SongType, songs: GetSongsResponse): Promise<any> {
    return this.storage.set(this.getAllSongScoresCacheKeyForType(type), songs);
  }

  private getCachedSongScores(type: SongType): Promise<GetSongsResponse> {
    return this.storage.get(this.getAllSongScoresCacheKeyForType(type));
  }

  private getAllSongScoresCacheKeyForType(type: SongType): string {
    return `ALL_SONG_SCORES_${type}`;
  }

  private getLatestScores(args: GetAllSongsArgs): Promise<GetSongsResponse> {
    const path = (() => {
      // If we had multiple `type` values, this is where we'd differentiate the scraping paths
      switch (args.type) {
        case 'single':
          return EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH;
        default:
          EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH
      }
    })();

    const url = toEAmusementUrl(path);

    return this.tryGetSongs(url, async response => {
      const firstPageDom = this.responseToDocument(response);
      const numPages = this.getNumPagesInPagedResponse(firstPageDom);

      let numProcessedPages = 0;

      const firstPageResponse = await this.getSongDataFromPagedResponse(firstPageDom);
      args.onProgress.next({ pageNum: ++numProcessedPages });

      const otherPagesPromises = _.range(1, numPages)
        .map(offset => {
          const offsetUrl = `${url}?offset=${offset}`;

          return this.tryGetSongs(offsetUrl, response => {
            const data = this.getSongDataFromPagedResponse(this.responseToDocument(response));
            args.onProgress.next({ pageNum: ++numProcessedPages });

            return data;
          })
        });

      const allResponses = [
        firstPageResponse,
        ...await Promise.all(otherPagesPromises)
      ];

      return allResponses
        .reduce((acc, res) => {
          if (acc.error) {
            return acc;
          }

          if (res.error) {
            acc.error = res.error;

            return acc;
          }

          acc.songs.splice(acc.songs.length, 0, ...res.songs);

          return acc;
        }, { songs: [] });
    });

  }

  private responseToDocument(response: HTTPResponse): Document {
    const html = response.data;
    return new DOMParser().parseFromString(html, 'text/html');
  }

  private getNumPagesInPagedResponse(dom: Document): number {
    const pages: HTMLElement[] = Array.apply(null, dom.querySelectorAll("#paging_box td div.page_num a"));

    return parseInt(pages[pages.length - 1].textContent);
  }

  private getSongDataFromPagedResponse(dom: Document): Promise<GetSongsResponse> {
    const songs = Array.apply(null, dom.querySelectorAll('#data_tbl tbody tr.data'))
      .map((row: HTMLElement) => {
        const columns: HTMLElement[] = Array.apply(null, row.querySelectorAll("td"));

        const song: Song = {
          title: columns[0].querySelector("a").text,
          thumbnailUrl: this.mungSongImageUrl(columns[0].querySelector("img").src),
          playInfo: columns
            .slice(1)
            .map(column => {
              return {
                column: column,
                score: column.querySelector('.data_score').textContent
              };
            })
            .filter(({ column, score }) => !isNaN(parseInt(score)))
            .map(({ column, score }) => {
              return <SongPlayInfo>{
                difficulty: {
                  difficulty: column.id,
                  ratingThumbnailUrl: this.mungSongImageUrl(column.querySelector<HTMLImageElement>(".data_rank a img:first-child").src),
                  score: score
                }
              };
            })
        };

        return song;
      });

    return Promise.resolve({ songs });
  }

  private async tryGetSongs(url: string, getSongsFn: (response: HTTPResponse) => Promise<GetSongsResponse>): Promise<GetSongsResponse> {
    try {
      this.http.setCookie(environment.eamusement.url, await this.getSessionCookie());

      console.log('keys: ' + JSON.stringify(Object.getOwnPropertyNames(this.http)))
      const response = await this.http.get(url, {}, {});

      if (response.error) {
        console.log('something went wrong fetching songs!')
        console.log(response.error);

        return { error: 'unknown' }
      }

      // If we were redirected because we're missing auth, let the caller know
      if (this.wasRedirectedToLogin(response)) {
        return { error: 'no-auth' };
      }

      return await getSongsFn(response);

    } catch (e) {
      console.log('something went critically wrong fetching songs!')
      console.log(JSON.stringify(e));

      // TODO: error handling
      return { error: 'unknown' };
    }
  }

  private async getSessionCookie(): Promise<string> {
    return `${environment.eamusement.sessionCookieKey}=${await this.session.get()}`;
  }

  private mungSongImageUrl(absoluteUrl: string): string {
    const url = new URL(absoluteUrl);
    url.searchParams.set('kind', '1');

    return `${toEAmusementUrl(url.pathname)}${url.search}`
  }

  private wasRedirectedToLogin(response: HTTPResponse): boolean {
    return response.url.indexOf('error/nologin.html') != -1;
  }
}
