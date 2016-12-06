import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

/*
  Generated class for the ResetPasswordPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/reset-password/reset-password.html',
})
export class ResetPasswordPage {
  static get parameters() {
    return [[NavController]];
  }

  constructor(public nav: NavController) {
    this.nav = nav;

  }
}
