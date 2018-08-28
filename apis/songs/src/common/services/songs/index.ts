import { Song, SongPlayInfo, SongType } from '../../models';
import { toEAmusementUrl } from '../../helpers';
import { EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH, EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH } from '../../helpers/constants';

import range from 'lodash/range'

const _ = {
    range
}

import { convert as convertJapanese, ConvertOptions } from 'encoding-japanese';
import fetch, { Response } from 'node-fetch';

export interface GetAllSongsArgs {
    type: SongType;
    sessionKey: string;
}

export interface GetSongsResponse {
    songs?: Song[],
    error?: 'no-auth' | 'unknown'
}

export interface SongsProviderConfig {
    eamusement: {
        url: string;
        sessionCookieKey: string;
    }
}

export class SongsService {
    constructor(private config: SongsProviderConfig) { }

    private toEAmusementUrl(path: string): string {
        return toEAmusementUrl(this.config.eamusement.url, path);
    }

    async getRecentlyPlayed(sessionKey: string): Promise<GetSongsResponse> {
        const url = this.toEAmusementUrl(EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH);

        return this.tryGetSongs(url, sessionKey, async response => {
            const dom = await this.responseToDocument(response);

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
        const path = (() => {
            // If we had multiple `type` values, this is where we'd differentiate the scraping paths
            switch (args.type) {
                case 'single':
                    return EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH;
                default:
                    return EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH;
            }
        })();

        const url = this.toEAmusementUrl(path);

        return this.tryGetSongs(url, args.sessionKey, async response => {
            const firstPageDom = await this.responseToDocument(response);
            const numPages = this.getNumPagesInPagedResponse(firstPageDom);

            const firstPageResponse = await this.getSongDataFromPagedResponse(firstPageDom);

            const otherPagesPromises = _.range(1, numPages)
                .map(offset => {
                    const offsetUrl = `${url}?offset=${offset}`;

                    return this.tryGetSongs(offsetUrl, args.sessionKey, async response => {
                        const data = this.getSongDataFromPagedResponse(await this.responseToDocument(response));

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

    private async responseToDocument(response: Response): Promise<Document> {
        const html = <string>convertJapanese(await response.buffer(), <ConvertOptions>{
            from: 'SJIS',
            to: 'UTF8',
            type: 'string'
        });

        console.log(html);

        return new DOMParser().parseFromString(html, 'text/html');
    }

    private getNumPagesInPagedResponse(dom: Document): number {
        const pages: HTMLElement[] = Array.apply(null, dom.querySelectorAll("#paging_box td div.page_num a"));

        return parseInt(pages[pages.length - 1].textContent as string);
    }

    private getSongDataFromPagedResponse(dom: Document): Promise<GetSongsResponse> {
        const songs = Array.apply(null, dom.querySelectorAll('#data_tbl tbody tr.data'))
            .map((row: HTMLElement) => {
                const columns: HTMLElement[] = Array.apply(null, row.querySelectorAll("td"));

                const song: Song = {
                    title: (columns[0].querySelector("a") as HTMLAnchorElement).text,
                    thumbnailUrl: this.mungSongImageUrl((columns[0].querySelector("img") as HTMLImageElement).src),
                    playInfo: columns
                        .slice(1)
                        .map(column => {
                            return {
                                column: column,
                                score: (column.querySelector('.data_score') as HTMLTableDataCellElement).textContent as string
                            };
                        })
                        .filter(({ column, score }) => !isNaN(parseInt(score)))
                        .map(({ column, score }) => {
                            return <SongPlayInfo>{
                                difficulty: {
                                    difficulty: column.id,
                                    ratingThumbnailUrl: this.mungSongImageUrl((column.querySelector(".data_rank a img:first-child") as HTMLImageElement).src),
                                    score: score
                                }
                            };
                        })
                };

                return song;
            });

        return Promise.resolve({ songs });
    }

    private async tryGetSongs(url: string, sessionKey: string, getSongsFn: (response: Response) => Promise<GetSongsResponse>): Promise<GetSongsResponse> {
        try {
            const response = await fetch(url, {
                headers: {
                    "Cookie": this.makeSessionCookie(sessionKey)
                }
            });

            if (!response.ok) {
                console.log('something went wrong fetching songs!')

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

    private mungSongImageUrl(absoluteUrl: string): string {
        const url = new URL(absoluteUrl);
        url.searchParams.set('kind', '1');

        return `${this.toEAmusementUrl(url.pathname)}${url.search}`
    }

    private wasRedirectedToLogin(response: Response): boolean {
        return response.url.indexOf('error/nologin.html') != -1;
    }

    private makeSessionCookie(sessionKey: string): string {
        return `${this.config.eamusement.sessionCookieKey}=${sessionKey}`;
    }
}
