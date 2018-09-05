import { SongStyle, Song, SongMetadata } from "../../models";

export interface GetAllSongsArgs {
    type: SongStyle;
    sessionKey: string;
}

export interface GetSongsScoresResponse {
    songs?: Song[];
    error?: 'no-auth' | 'unknown';
}

export interface GetSongsMetadataResponse {
    songs: SongMetadata[];
}