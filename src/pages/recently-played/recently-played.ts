import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Song } from '../../models';
import { SongsProvider } from '../../providers/songs/songs';

@Component({
  selector: 'page-recently-played',
  templateUrl: 'recently-played.html',
})
export class RecentlyPlayedPage {
  songs: Song[];

  constructor(public navCtrl: NavController, public navParams: NavParams, private songsProvider: SongsProvider) {
    this.init();
  }

  async init(): Promise<any> {
    this.songs = await this.songsProvider.getRecentlyPlayed();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad RecentlyPlayedPage');
  }
}
