import { Component, Input } from '@angular/core';
import { Nav } from 'ionic-angular';
import { OptionsPage } from '../../pages/options/options';

@Component({
  selector: 'navbar',
  templateUrl: 'navbar.html'
})
export class NavbarComponent {
  @Input()
  title: string;

  constructor(private nav: Nav) { }

  openOptions() {
    this.nav.push(OptionsPage);
  }
}
