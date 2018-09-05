import { Component, EventEmitter } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController } from 'ionic-angular';
import { UiProvider } from '../../providers/ui/ui';
import { Song } from '../../models';
import { Observable } from 'rxjs/Observable';

import groupBy from 'lodash/groupBy';
import flatMap from 'lodash/flatMap';

const _ = { groupBy, flatMap };

enum SongFilterType {
  Level,
  Rating,
  Series,
  Genre,
  Version
}

interface SongGrouping { grouping: string; songs: Song[] };
type SongFilterOp = (songs: Song[]) => SongGrouping[];

interface SongFilter {
  text: string;
  filter: SongFilterType;
  op: SongFilterOp
}

@Component({
  selector: 'page-scores-overview',
  templateUrl: 'scores-overview.html',
})
export class ScoresOverviewPage {
  songs: Song[] = [];

  activeFilter: SongFilter;
  filters: SongFilter[] = [
    {
      text: 'By Level',
      filter: SongFilterType.Level,
      op: songs => {
        return this.groupSongsBy(songs, song => song.playInfo[0].difficulty.difficulty);
      }
    },
    {
      text: 'By Rating',
      filter: SongFilterType.Rating,
      op: songs => {
        return this.groupSongsBy(songs, song => song.playInfo[0].difficulty.score);
      }
    }
  ];

  constructor(public navCtrl: NavController, public navParams: NavParams, private ui: UiProvider, private loader: LoadingController, private alert: AlertController) { }

  private groupSongsBy<T>(songs: Song[], groupByFn: (song: Song) => T) {
    const songsByPlayInfo = this.toSongsByPlayInfo(songs);
    const groupedResults = _.groupBy(songsByPlayInfo, groupByFn);

    return Object.keys(groupedResults)
      .map<SongGrouping>(grouping => {
        return {
          grouping: grouping,
          songs: groupedResults[grouping]
        };
      })
  }

  private toSongsByPlayInfo(songs: Song[]) {
    return _.flatMap(songs, song => {
      return song.playInfo.map<Song>(playInfo => {
        return {
          ...song,
          playInfo: [playInfo]
        };
      });
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScoresPage');
  }

  async ionViewDidEnter() {
    await this.init();
  }

  async init() {
    this.setActiveFilter();
    this.getScoreData(false);
  }

  setActiveFilter() {
    this.activeFilter = this.activeFilter || (this.filters.length && this.filters[0]);
  }

  async getScoreData(getLatest: boolean) {
    try {
      const onProgress = new EventEmitter<{ pageNum: number }>();

      await this.ui.tryGetSongs({
        getSongsFn: songs => {
          return songs.getAll({
            type: 'single',
            getLatest: getLatest,
            onProgress
          });
        },
        afterGetSongsFn: async response => {
          this.songs.splice(0, this.songs.length - 1, ...response.songs);
        }
      });
    } catch (e) {
      this.alert.create({ message: 'Something went wrong fetching songs!' }).present();
    }
  }

  getVisibleSongGroupings(): SongGrouping[] {
    return this.activeFilter.op(this.songs);
  }

  onClickRefreshButton() {
    this.getScoreData(true);
  }
}
