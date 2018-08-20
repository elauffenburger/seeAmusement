import { Component, ViewChild, Inject, Injector } from '@angular/core';
import { Nav, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { RecentlyPlayedPage } from '../pages/recently-played/recently-played';

import { environment } from '@app/env';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = HomePage;

  pages: Array<{ title: string, component: any }>;

  constructor(public platform: Platform, public statusBar: StatusBar, public splashScreen: SplashScreen, public injector: Injector) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Home', component: HomePage },
      { title: 'Recently Played', component: RecentlyPlayedPage }
    ];

  }

  async initializeApp() {
    await this.platform.ready();

    if (environment.onLoad) {
      environment.onLoad(this);
    }

    this.statusBar.styleDefault();
    this.splashScreen.hide();
  }

  openPage(page) {
    this.nav.setRoot(page.component);
  }
}
