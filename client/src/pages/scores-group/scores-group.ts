import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Song, SongMetadataLookup, SongStyleMetadata } from '../../models';

export interface PageArgs {
  pageTitle: string;
  songs: Song[];
  metadata: SongMetadataLookup;
}

@Component({
  selector: 'page-scores-group',
  templateUrl: 'scores-group.html',
})
export class ScoresGroupPage {
  pageTitle: string;
  songs: Song[];
  metadata: SongMetadataLookup;

  constructor(public navCtrl: NavController, public navParams: NavParams) {
    const args: PageArgs = <PageArgs>navParams.data;

    this.pageTitle = args.pageTitle;
    this.songs = args.songs;
    this.metadata = args.metadata;
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScoresGroupPage');
  }
}
