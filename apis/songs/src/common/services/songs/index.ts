import { Song, SongPlayInfo, SongStyle, SongMetadata, SongStyleMetadata, SongStyleDifficultyMetadata, SongStyleDifficultyName, SongPlayRating } from '../../models';
import { toEAmusementUrl } from '../../helpers';
import { EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH, EAMUSEMENT_DDR_PLAY_DATA_SINGLE_PATH, EAMUSEMENT_DDR_MUSIC_INDEX_PATH } from '../../helpers/constants';

import range from 'lodash/range'
import flatMap from 'lodash/flatMap';
import take from 'lodash/take';

const _ = { range, flatMap, take }

import fetch, { Response } from 'node-fetch';
import iconv from 'iconv-lite';

import $ from 'cheerio';

import URL from 'url';
import querystring from 'querystring';
import { GetSongsScoresResponse, GetAllSongsArgs, GetSongsMetadataResponse } from './models';

export interface SongsProviderConfig {
    eamusement: {
        url: string;
        sessionCookieKey: string;
    }
}

export * from './models';

export class SongsService {
    private static metadata: GetSongsMetadataResponse;

    constructor(private config: SongsProviderConfig) { }

    private toEAmusementUrl(path: string): string {
        return toEAmusementUrl(this.config.eamusement.url, path);
    }

    async getMetadata(getLatest: boolean): Promise<GetSongsMetadataResponse> {
        // If we don't care about the absolute latest metadata...
        if (!getLatest) {
            const cachedMetadata = this.getCachedSongsMetadata();

            // ...and we've cached metadata: just hand that back!
            if (cachedMetadata) {
                return cachedMetadata;
            }
        }

        // ...otherwise, fetch the latest!
        const url = this.toEAmusementUrl(EAMUSEMENT_DDR_MUSIC_INDEX_PATH);

        // Get the first page
        const firstPageDom = await fetch(url)
            .then(res => this.eamusementResponseToDocument(res));

        // Figure out how many pages total there are
        const numPages = this.getNumPagesInPagedResponse(firstPageDom);
        console.log(`numPages: ${numPages}`);

        // Parse all the other pages
        const otherPagesPromises = _.range(1, numPages)
            .map(async pageNum => {
                const pageUrl = `${url}?offset=${pageNum}`;
                console.log(`fetching: ${pageUrl}`);

                const dom = await fetch(pageUrl)
                    .then(res => this.eamusementResponseToDocument(res));

                return this.getSongsMetadataFromPage(dom);
            });

        const songs = [
            this.getSongsMetadataFromPage(firstPageDom),
            ...await Promise.all(otherPagesPromises)
        ];

        const result = {
            songs: _.flatMap(songs)
        };

        // Cache the result
        this.cacheSongsMetadata(result);

        return result;
    }

    async getRecentlyPlayed(sessionKey: string): Promise<GetSongsScoresResponse> {
        const url = this.toEAmusementUrl(EAMUSEMENT_DDR_RECENTLY_PLAYED_PATH);

        return this.tryGetSongs(url, sessionKey, async response => {
            const dom = await this.eamusementResponseToDocument(response);

            const songs = dom(`table#data_tbl tbody tr`)
                .slice(1)
                .map((rowIndex, rowEl) => {
                    const row = $(rowEl);

                    const columns = row.find('td');
                    const titleColumn = $(columns.get(0));

                    const imageUrl = titleColumn.find('img').attr('src');
                    const score = parseInt($(columns.get(3)).text());

                    const ratingThumbnailUrl = $(columns.get(2)).find('img').attr('src');

                    const song: Song = {
                        title: titleColumn.find('a').text(),
                        id: this.getSongIdFromImageUrl(imageUrl),
                        thumbnailUrl: this.mungSongImageUrl(imageUrl),
                        playInfo: [
                            {
                                timestamp: $(columns.get(4)).text(),
                                score: isNaN(score) ? null : score,
                                rating: this.getRatingFromImageUrl(this.getRatingFromImageUrl(ratingThumbnailUrl)),
                                difficulty: {
                                    difficulty: $(columns.get(1)).text(),
                                    ratingThumbnailUrl: this.mungSongImageUrl(ratingThumbnailUrl),
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

    async getAll(args: GetAllSongsArgs): Promise<GetSongsScoresResponse> {
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
            const firstPageDom = await this.eamusementResponseToDocument(response);
            const numPages = this.getNumPagesInPagedResponse(firstPageDom);

            const firstPageResponse = await this.getSongDataFromPagedScoresResponse(firstPageDom);
            const otherPagesPromises = _.range(1, numPages)
                .map(offset => {
                    const offsetUrl = `${url}?offset=${offset}`;

                    return this.tryGetSongs(offsetUrl, args.sessionKey, async response => {
                        const data = this.getSongDataFromPagedScoresResponse(await this.eamusementResponseToDocument(response));

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

    private async eamusementResponseToDocument(response: Response): Promise<CheerioStatic> {
        const html = iconv.decode(await response.buffer(), 'CP932')

        return $.load(html);
    }

    private getNumPagesInPagedResponse(dom: CheerioStatic): number {
        const pages = dom("#paging_box td div.page_num a");

        return parseInt($(pages[pages.length - 1]).text());
    }

    private getSongsMetadataFromPage(dom: CheerioStatic): SongMetadata[] {
        return dom('#data_tbl tr.data')
            .toArray()
            .map<SongMetadata>(row => {
                const $row = $(row);

                const imageUrl = $row.find('td.jk img').attr('src');

                return {
                    id: this.getSongIdFromImageUrl(imageUrl),
                    title: $row.find('.music_tit').text(),
                    artist: $row.find('.artist_nam').text(),
                    styles: [
                        {
                            style: 'single',
                            difficulties: _.take($row.find('.difficult').toArray(), 5)
                                .reduce<SongStyleDifficultyMetadata[]>((acc, difficultyCol) => {
                                    const $difficultyCol = $(difficultyCol);

                                    const shortDifficultyName = $difficultyCol.prop('class').split(' ')[1];
                                    const score = parseInt($difficultyCol.text());

                                    if (!isNaN(score)) {
                                        acc.push({
                                            name: toFullDifficultyName(shortDifficultyName),
                                            value: score
                                        })
                                    }

                                    return acc;
                                }, [])
                        }
                    ]
                };
            });

        function toFullDifficultyName(shortName: 'be' | 'ba' | 'di' | 'ex' | 'ch'): SongStyleDifficultyName {
            switch (shortName) {
                case 'be': return 'beginner';
                case 'ba': return 'basic';
                case 'di': return 'difficult';
                case 'ex': return 'expert';
                case 'ch': return 'challenge';
            }
        }
    }

    private getSongDataFromPagedScoresResponse(dom: CheerioStatic): Promise<GetSongsScoresResponse> {
        const songs = dom('#data_tbl tbody tr.data')
            .map((rowIndex, rowElement) => {
                const row = $(rowElement);

                const columns = row.find("td");
                const titleColumn = $(columns.get(0));

                const imageUrl = titleColumn.find('img').attr('src');

                const song: Song = {
                    title: titleColumn.find('a').text(),
                    id: this.getSongIdFromImageUrl(imageUrl),
                    thumbnailUrl: this.mungSongImageUrl(imageUrl),
                    playInfo: columns
                        .slice(1)
                        .map((columnIndex, columnElement) => {
                            const column = $(columnElement);

                            return {
                                column: column,
                                score: parseInt(column.find('.data_score').text())
                            };
                        })
                        .get<{ column: Cheerio, score: number }>()
                        .map(({ column, score }) => {
                            const ratingImageUrl = column.find(".data_rank a img:first-child").attr('src');

                            return <SongPlayInfo>{
                                score: isNaN(score) ? null : score,
                                rating: this.getRatingFromImageUrl(ratingImageUrl),
                                difficulty: {
                                    difficulty: column.attr('id'),
                                    ratingThumbnailUrl: this.mungSongImageUrl(ratingImageUrl),
                                }
                            };
                        })
                };

                return song;
            })
            .get<Song>();

        return Promise.resolve({ songs });
    }

    private async tryGetSongs(url: string, sessionKey: string, getSongsFn: (response: Response) => Promise<GetSongsScoresResponse>): Promise<GetSongsScoresResponse> {
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

    private getRatingFromImageUrl(url: string): SongPlayRating {
        return <SongPlayRating>url.match(/rank_s_(.*?)(?:_.*)?.png/)[1].toUpperCase();
    }

    private mungSongImageUrl(absoluteUrl: string): string {
        const url = URL.parse(absoluteUrl, true);
        const query = querystring.stringify({ ...url.query, kind: '1' });

        return `${this.toEAmusementUrl(url.pathname)}?${query}`
    }

    private getSongIdFromImageUrl(url: string): string {
        return URL.parse(url, true).query.img as string;
    }

    private wasRedirectedToLogin(response: Response): boolean {
        return response.url.indexOf('error/nologin.html') != -1;
    }

    private makeSessionCookie(sessionKey: string): string {
        return `${this.config.eamusement.sessionCookieKey}=${sessionKey}`;
    }

    private getCachedSongsMetadata(): GetSongsMetadataResponse {
        return SongsService.metadata;
    }

    private cacheSongsMetadata(metadata: GetSongsMetadataResponse): void {
        SongsService.metadata = metadata;
    }
}
