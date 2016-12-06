/**
 * @summary Cette classe gére la confirmation d'un compte
 * lorsque qu'un nouvel utilisateur s'ajoute.
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

/*
 Generated class for the RegisterPage page.
 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
    templateUrl: 'build/pages/confirmAccount/confirmAccount.html',
})

export class confirmAccountPage {
    constructor(private nav: NavController, private http: Http, private alertCtrl: AlertController) {
    }

    confirmCode() {
        var db = firebase.database();
        var ref = db.ref("Users");
        let user = firebase.auth().currentUser;
        let savedCode;
        let code = (<HTMLInputElement>document.getElementById("code"));
        let _this = this
        ref.orderByChild("email").equalTo(user.email).on("child_added", function(snapshot) {
            savedCode = snapshot.val().code;
            if (code.value == savedCode) {
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
    }

}
