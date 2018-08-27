import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController, NavControllerBase, LoadingController } from 'ionic-angular';
import { Song, SongPlayInfo } from '../../models';
import { SongsProvider } from '../../providers/songs/songs';
import { SessionProvider } from '../../providers/session/session';
import { UiProvider } from '../../providers/ui/ui';

@Component({
  selector: 'page-recently-played',
  templateUrl: 'recently-played.html',
})
export class RecentlyPlayedPage {
  songs: Song[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private songsProvider: SongsProvider, private toast: ToastController, private alert: AlertController, private session: SessionProvider, private ui: UiProvider, private loader: LoadingController) { }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RecentlyPlayedPage');
  }

  async ionViewDidEnter() {
    await this.init();
  }

  async init(): Promise<any> {
    await this.ui.tryGetSongs({
      getSongsFn: songs => songs.getRecentlyPlayed(),
      afterGetSongsFn: async response => {
        this.songs.splice(0, this.songs.length, ...response.songs);

        console.log('loaded songs');
      }
    });
  }

  toRecentlyPlayedSongs(songs: Song[]): { title: string; thumbnailUrl: string; playInfo: SongPlayInfo }[] {
    return songs.map(song => {
      return {
        title: song.title,
        thumbnailUrl: song.thumbnailUrl,
        playInfo: song.playInfo[0]
      };
    });
  }

  showSongDebugInfo(song: Song) {
    this.alert.create({ message: JSON.stringify(song) }).present();
  }
}
