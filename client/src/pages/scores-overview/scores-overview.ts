import { Component, EventEmitter } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController } from 'ionic-angular';
import { UiProvider } from '../../providers/ui/ui';
import { Song, SongMetadataLookup, SongDifficultyInfo, SongStyleDifficultyMetadata, SongPlayRating } from '../../models';
import { Observable } from 'rxjs/Observable';
import { SongsProvider } from '../../providers/songs/songs';

import groupBy from 'lodash/groupBy';
import flatMap from 'lodash/flatMap';
import orderBy from 'lodash/orderBy';

const _ = { groupBy, flatMap, orderBy };

enum SongFilterType {
  Level,
  Rating,
  Series,
  Genre,
  Version
}

interface SongGrouping { grouping: string; songs: Song[]; };
type SongFilterOp = (songs: Song[]) => SongGrouping[];

interface SongFilter {
  text: string;
  filter: SongFilterType;
  op: SongFilterOp
}

const UNKNOWN_GROUP_NAME = 'Unknown';

@Component({
  selector: 'page-scores-overview',
  templateUrl: 'scores-overview.html',
})
export class ScoresOverviewPage {
  songs: Song[] = [];
  metadata: SongMetadataLookup;

  visibleSongGroupings: SongGrouping[] = [];

  activeFilter: SongFilter;
  filters: SongFilter[] = [
    {
      text: 'By Level',
      filter: SongFilterType.Level,
      op: songs => {
        const groupByFn = (song: Song) => {
          const unknownGroupName = `${UNKNOWN_GROUP_NAME} - ${song.title[0].toUpperCase()}`;

          // Try to find the corresponding metadata for this song
          const metadata = this.metadata[song.id];
          if (!metadata) {
            return unknownGroupName;
          }

          // Try to find play info for this song
          const playInfo = song.playInfo[0];
          if (!playInfo || !playInfo.difficulty) {
            return unknownGroupName;
          }

          // Try to find the difficulty info for this song
          const difficultyName = playInfo.difficulty.difficulty;
          const difficultyMetadata = metadata.styles[0].difficulties.find(d => d.name == difficultyName);

          // If there's no difficulty metadata, that means this
          // song probably doesn't actually have this difficulty level
          if (!difficultyMetadata) {
            return null;
          }

          if (!difficultyMetadata.value) {
            return unknownGroupName;
          }

          // Figure out if this is unplayed song
          if (!playInfo.score) {
            return this.getUnplayedDifficultyGroupName(difficultyMetadata);
          }

          return difficultyMetadata.value;
        };

        const orderByFn = group => {
          const grouping = group.grouping;
          const groupingParts = grouping.split(' ');

          // We want the order to be: played -> unplayed -> unknown
          const order = grouping.startsWith(UNKNOWN_GROUP_NAME)
            ? 1 / 1000
            : groupingParts.length == 1
              ? parseInt(groupingParts[0])
              : parseInt(groupingParts[0]) / 50;

          return 1 / order;
        };

        return this.groupSongsBy(songs, groupByFn, orderByFn);
      }
    },
    {
      text: 'By Rating',
      filter: SongFilterType.Rating,
      op: songs => {
        return this.groupSongsBy(songs, song => song.playInfo[0].rating, group => {
          const groupKey = group.grouping;
          const ratings: SongPlayRating[] = ['AAA', 'AA', 'A', 'B', 'C', 'D', 'E', 'NONE'];

          return ratings.indexOf(<any>groupKey);
        });
      }
    }
  ];

  constructor(public navCtrl: NavController, public navParams: NavParams, private ui: UiProvider, private loader: LoadingController, private alert: AlertController, private songsProvider: SongsProvider) { }

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

    this.refreshVisibleSongGroupings();
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

          this.metadata = await this.songsProvider.getMetadata();

          this.refreshVisibleSongGroupings();
        }
      });
    } catch (e) {
      this.alert.create({ message: 'Something went wrong fetching songs!' }).present();
    }
  }

  getVisibleSongGroupings(): SongGrouping[] {
    return this.activeFilter.op(this.songs);
  }

  refreshVisibleSongGroupings() {
    this.visibleSongGroupings = this.getVisibleSongGroupings();
    console.log('visibleSongGroupings.length: ', this.visibleSongGroupings.length);
  }

  onClickRefreshButton() {
    this.getScoreData(true);
  }

  onChangeActiveFilter(filter: SongFilter) {
    this.activeFilter = filter;

    this.refreshVisibleSongGroupings();
  }

  private getUnplayedDifficultyGroupName(difficulty: SongStyleDifficultyMetadata): string {
    return `${difficulty.value} (Unplayed)`;
  }

  private groupSongsBy<T>(songs: Song[], groupByFn: (song: Song) => T, orderByFn: (grouping: SongGrouping) => number) {
    const songsFlattenedByPlayInfo = _.flatMap(songs, song => {
      return song.playInfo.map<Song>(playInfo => {
        return {
          ...song,
          playInfo: [playInfo]
        };
      });
    });

    const groupedResults = _.groupBy(songsFlattenedByPlayInfo, groupByFn);

    const results = Object.keys(groupedResults)
      .filter(key => !!key && key != 'null')
      .map<SongGrouping>(grouping => {
        return {
          grouping: grouping,
          songs: groupedResults[grouping]
        };
      });

    return _.orderBy(results, orderByFn);
  }
}
