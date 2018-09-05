import { Injectable } from '@angular/core';
import { SessionProvider } from '../session/session';
import { Song, SongType } from '../../models';

import { environment } from '@app/env';
import { Observer } from 'rxjs/Observer';

import { Storage } from '@ionic/storage';
import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';

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
  constructor(private http: HttpClient, private session: SessionProvider, private storage: Storage) { }

  async getRecentlyPlayed(): Promise<GetSongsResponse> {
      console.log('getting recently played...')

      const url = `${environment.apiUrl}/songs/recently-played`;
      const body = { sessionKey: await this.session.get() };

      console.log('loading url: ', url);

      return await this.http.post<GetSongsResponse>(url, body).toPromise();
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

  private async getLatestScores(args: GetAllSongsArgs): Promise<GetSongsResponse> {
    return this.http.post<GetSongsResponse>(`${environment.apiUrl}/songs/all`, { type: args.type, getLatest: args.getLatest, sessionKey: await this.session.get() }).toPromise();
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
}
