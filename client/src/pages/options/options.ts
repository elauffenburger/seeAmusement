import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { SessionProvider } from '../../providers/session/session';
import { SongsProvider } from '../../providers/songs/songs';


@Component({
  selector: 'page-options',
  templateUrl: 'options.html',
})
export class OptionsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private session: SessionProvider, private toast: ToastController,  private songs: SongsProvider) { }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OptionsPage');
  }

  async login() {
    const session = await this.session.login();

    console.log('session: ', session);

    // Let the user know we found the session
    this.toast.create({ message: 'Retrieved session!', duration: 1000 }).present();
  }

  async refreshMetadata() {
    await this.songs.getMetadata(true);

    this.toast.create({ message: 'Refreshed Metadata!', duration: 1000 }).present();
  }
}
