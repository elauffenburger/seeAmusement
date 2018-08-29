import { Song, SongPlayInfo, SongType } from '../../models';
import { toEAmusementUrl } from '../../helpers';
import { EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH, EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH } from '../../helpers/constants';

import range from 'lodash/range'

const _ = { range }

import fetch, { Response } from 'node-fetch';
import iconv from 'iconv-lite';

import $ from 'cheerio';

import URL from 'url';
import querystring from 'querystring';

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

            const songs = dom(`table#data_tbl tbody tr`)
                .slice(1)
                .map((rowIndex, rowEl) => {
                    const row = $(rowEl);

                    const columns = row.find('td');
                    const titleColumn = $(columns.get(0));

                    const song: Song = {
                        title: titleColumn.find('a').text(),
                        thumbnailUrl: this.mungSongImageUrl(titleColumn.find('img').attr('src')),
                        playInfo: [
                            {
                                timestamp: $(columns.get(4)).text(),
                                difficulty: {
                                    difficulty: $(columns.get(1)).text(),
                                    ratingThumbnailUrl: this.mungSongImageUrl($(columns.get(2)).find('img').attr('src')),
                                    score: $(columns.get(3)).text(),
                                }
                            }
                        ]
                    };

                    return song;
                })
                .get<Song>();

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

    private async responseToDocument(response: Response): Promise<CheerioStatic> {
        const html = iconv.decode(await response.buffer(), 'CP932')

        return $.load(html);
    }

    private getNumPagesInPagedResponse(dom: CheerioStatic): number {
        const pages = dom("#paging_box td div.page_num a");

        return parseInt($(pages[pages.length - 1]).text());
    }

    private getSongDataFromPagedResponse(dom: CheerioStatic): Promise<GetSongsResponse> {
        const songs = dom('#data_tbl tbody tr.data')
            .map((rowIndex, rowElement) => {
                const row = $(rowElement);

                const columns = row.find("td");
                const titleColumn = $(columns.get(0));

                const song: Song = {
                    title: titleColumn.find('a').text(),
                    thumbnailUrl: this.mungSongImageUrl(titleColumn.find('img').attr('src')),
                    playInfo: columns
                        .slice(1)
                        .map((columnIndex, columnElement) => {
                            const column = $(columnElement);

                            return {
                                column: column,
                                score: column.find('.data_score').text()
                            };
                        })
                        .get<{ column: Cheerio, score: string }>()
                        .filter(({ column, score }) => !isNaN(parseInt(score)))
                        .map(({ column, score }) => {
                            return <SongPlayInfo>{
                                difficulty: {
                                    difficulty: column.attr('id'),
                                    ratingThumbnailUrl: this.mungSongImageUrl(column.find(".data_rank a img:first-child").attr('src')),
                                    score: score
                                }
                            };
                        })
                };

                return song;
            })
            .get<Song>();

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
            console.log(e);

            // TODO: error handling
            return { error: 'unknown' };
        }
    }

    private mungSongImageUrl(absoluteUrl: string): string {
        const url = URL.parse(absoluteUrl, true);
        const query = querystring.stringify({ ...url.query, kind: '1' });

        return `${this.toEAmusementUrl(url.pathname)}${query}`
    }

    private wasRedirectedToLogin(response: Response): boolean {
        return response.url.indexOf('error/nologin.html') != -1;
    }

    private makeSessionCookie(sessionKey: string): string {
        return `${this.config.eamusement.sessionCookieKey}=${sessionKey}`;
    }
}
