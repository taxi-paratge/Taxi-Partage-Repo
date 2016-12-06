/**
 * @summary Cette classe gére le changement du mot de passe
 *
 * @author Equipe Whos.
 */

import { Component, Injectable } from '@angular/core';
import { NavController, Platform, AlertController } from 'ionic-angular';
import {LoginPage} from '../login/login';
import {HomePage} from "../home/home";
import {Http, Response, Headers, RequestOptions, HTTP_PROVIDERS, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs/Rx";

import "rxjs/add/operator/map";
import "rxjs/add/operator/catch"


declare var firebase: any;
declare var $: any;
@Injectable()

@Component({
    templateUrl: 'build/pages/changePassword/changePassword.html',
})



export class changePasswordPage {

  private currentUserPassword: any;
  private newPassword: any;

    constructor(private nav: NavController, private http: Http, private alertCtrl: AlertController)
    {

    }

    enregistrer() {
      console.log(this.currentUserPassword);
      console.log(this.newPassword);
    }
        /*var db = firebase.database();
        var ref = db.ref("Users");
        let user = firebase.auth().currentUser;
        let savedCode;
        let _this = this

        ref.orderByChild("email").equalTo(user.email).on("child_added", function(snapshot) {
            savedCode = snapshot.val().;
            console.log('code value html ', code.value);
            console.log('code value db ', savedCode);
            if (_this.currentUserPassword == savedCode) {
              firebase.database().ref('Users/' + firebase.auth().currentUser.uid + "/confirmedAccount").set(true);
                _this.nav.setRoot(HomePage);
            }
            else {
                let alert = _this.alertCtrl.create({
                    title: 'Code incorrect',
                    subTitle: 'Veuillez entrez le code que vous avez reçu par SMS',
                    buttons: ['OK']
                });
                alert.present();
            }

        });

    }*/

}
