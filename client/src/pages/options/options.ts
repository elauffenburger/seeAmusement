import { Component } from '@angular/core';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { SessionProvider } from '../../providers/session/session';


@Component({
  selector: 'page-options',
  templateUrl: 'options.html',
})
export class OptionsPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private session: SessionProvider, private toast: ToastController) { }

  ionViewDidLoad() {
    console.log('ionViewDidLoad OptionsPage');
  }

  async login() {
    const session = await this.session.login();

    console.log('session: ', session);

    // Let the user know we found the session
    this.toast.create({ message: 'Retrieved session!', duration: 1000 }).present();
  }
}
