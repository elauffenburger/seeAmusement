import { Injectable } from '@angular/core';
import { SessionProvider } from '../session/session';
import { Song, SongStyle, SongMetadata } from '../../models';

import { environment } from '@app/env';
import { Observer } from 'rxjs/Observer';

import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';

export interface GetAllSongsArgs {
  type: SongStyle;
  getLatest: boolean;
  onProgress?: Observer<{ pageNum: number }>;
}

export interface GetSongsScoresResponse {
  songs?: Song[],
  error?: 'no-auth' | 'unknown'
}

export interface GetSongsMetadataResponse {
  songs: SongMetadata[];
}

@Injectable()
export class SongsProvider {
  constructor(private http: HttpClient, private session: SessionProvider, private storage: Storage) { }

  async getMetadata(getLatest: false): Promise<GetSongsMetadataResponse> {
    const url = `${environment.apiUrl}/songs/metadata`;

    return await this.http.get<GetSongsMetadataResponse>(url).toPromise();
  }

  async getRecentlyPlayed(): Promise<GetSongsScoresResponse> {
    console.log('getting recently played...')

    const url = `${environment.apiUrl}/songs/recently-played`;
    const body = { sessionKey: await this.session.get() };

    return await this.http.post<GetSongsScoresResponse>(url, body).toPromise();
  }

  async getAll(args: GetAllSongsArgs): Promise<GetSongsScoresResponse> {
    console.log('getting all...');

    args.onProgress = args.onProgress || Observable.create();

    // If we need to get the latest or we haven't cached any song scores yet
    if (args.getLatest || !await this.hasCachedSongScores(args.type)) {
      const songs = await this.getLatestScores(args);
      this.cacheSongScores(args.type, songs);

      return songs;
    }

    return this.getCachedSongScores(args.type);
  }

  private async getLatestScores(args: GetAllSongsArgs): Promise<GetSongsScoresResponse> {
    return this.http.post<GetSongsScoresResponse>(`${environment.apiUrl}/songs/all`, { type: args.type, getLatest: args.getLatest, sessionKey: await this.session.get() }).toPromise();
  }

  private async hasCachedSongScores(type: SongStyle): Promise<boolean> {
    return this.hasCacheKey(this.getAllSongScoresCacheKeyForType(type));
  }

  private cacheSongScores(type: SongStyle, songs: GetSongsScoresResponse): Promise<any> {
    return this.storage.set(this.getAllSongScoresCacheKeyForType(type), songs);
  }

  private getCachedSongScores(type: SongStyle): Promise<GetSongsScoresResponse> {
    return this.storage.get(this.getAllSongScoresCacheKeyForType(type));
  }

  private getAllSongScoresCacheKeyForType(type: SongStyle): string {
    return `ALL_SONG_SCORES_${type}`;
  }

  private hasCachedSongsMetadata(): Promise<boolean> {
    return this.hasCacheKey(this.getSongsMetadataCacheKey());
  }

  private getCachedSongsMetadata(): Promise<GetSongsMetadataResponse> {
    return this.storage.get(this.getSongsMetadataCacheKey());
  }

  private cacheSongsMetadata(metadata: GetSongsMetadataResponse) {
    return this.storage.set(this.getSongsMetadataCacheKey(), metadata);
  }

  private getSongsMetadataCacheKey(): string {
    return `SONGS_METADATA`;
  }

  private hasCacheKey(key: string): Promise<boolean> {
    return this.storage.keys().then(keys => !!keys.find(k => k == key));
  }
}
