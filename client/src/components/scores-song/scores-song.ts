import { Component, Input } from '@angular/core';
import { Song } from '../../models';

@Component({
  selector: 'scores-song',
  templateUrl: 'scores-song.html'
})
export class ScoresSongComponent {
  @Input()
  song: Song;

  constructor() { }
}
