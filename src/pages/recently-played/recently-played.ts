import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, AlertController } from 'ionic-angular';
import { Song } from '../../models';
import { SongsProvider } from '../../providers/songs/songs';

@Component({
  selector: 'page-recently-played',
  templateUrl: 'recently-played.html',
})
export class RecentlyPlayedPage {
  songs: Song[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private songsProvider: SongsProvider, private toast: ToastController, private alert: AlertController) {
    this.init();
  }

  async init(): Promise<any> {
    this.songs.splice(0, this.songs.length, ...await this.songsProvider.getRecentlyPlayed());
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RecentlyPlayedPage');
  }

  showSongDebugInfo(song: Song) {
    this.alert.create({ message: JSON.stringify(song) }).present();
  }
}
