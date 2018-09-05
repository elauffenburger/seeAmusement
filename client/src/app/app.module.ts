import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicStorageModule } from '@ionic/storage';
import { HTTP } from '@ionic-native/http';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { ComponentsModule } from '../components/components.module';
import { OptionsPage } from '../pages/options/options';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SessionProvider } from '../providers/session/session';
import { RecentlyPlayedPage } from '../pages/recently-played/recently-played';
import { SongsProvider } from '../providers/songs/songs';
import { HttpClientModule } from '@angular/common/http';
import { ScoresOverviewPage } from '../pages/scores-overview/scores-overview';
import { UiProvider } from '../providers/ui/ui';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    OptionsPage,
    RecentlyPlayedPage,
    ScoresOverviewPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot(),
    HttpClientModule,
    ComponentsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    OptionsPage,
    RecentlyPlayedPage,
    ScoresOverviewPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    InAppBrowser,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    SessionProvider,
    SongsProvider,
    HTTP,
    UiProvider
  ]
})
export class AppModule { }
