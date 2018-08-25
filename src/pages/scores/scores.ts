import { Component, EventEmitter } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController } from 'ionic-angular';
import { UiProvider } from '../../providers/ui/ui';
import { Song } from '../../models';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'page-scores',
  templateUrl: 'scores.html',
})
export class ScoresPage {
  songs: Song[] = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private ui: UiProvider, private loader: LoadingController, private alert: AlertController) { }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScoresPage');
  }

  async ionViewDidEnter() {
    await this.init();
  }

  async init() {
    this.refreshScoreData(false);
  }

  async refreshScoreData(getLatest: boolean) {
    try {
      const onProgress = new EventEmitter<{ pageNum: number }>();
      onProgress.subscribe((progress: { pageNum: number }) => {
        console.log(`loaded page ${progress.pageNum}`);
      });

      await this.ui.tryGetSongs({
        getSongsFn: songs => {
          return songs.getAll({
            type: 'single',
            getLatest: getLatest,
            onProgress
          });
        },
        afterGetSongsFn: async response => {
          console.log(response.songs[0].title);
          console.log(`"蒼い衝動 ～for EXTREME～"`);

          this.songs.splice(0, this.songs.length - 1, ...response.songs);
        }
      });
    } catch (e) {
      this.alert.create({ message: 'Something went wrong fetching songs!' }).present();
    }
  }

  onClickRefreshButton() {
    this.refreshScoreData(true);
  }
}
