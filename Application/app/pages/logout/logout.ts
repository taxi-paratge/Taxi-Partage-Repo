/**
 * @summary Cette classe gère la logique de de deconnexion
 *
 * @author Equipe Whos.
 */


import { Component } from '@angular/core';
import { NavController, Platform, AlertController, Slides } from 'ionic-angular';
import {LoginPage} from '../login/login';
import {HomePage} from '../home/home';
import { PaymentMethodPage } from '../payment-method/payment-method';
import {RideShareRequestPage} from "../ride-share-request/ride-share-request";
declare var google: any;
declare var firebase: any;


/*
 Generated class for the HomePage page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
    templateUrl: 'build/pages/logout/logout.html',
})
export class LogoutPage {

    private currentUserName: string;
    constructor(private nav: NavController, private platform: Platform, private alertCtrl: AlertController) {
        console.log('init logout');

        let _this = this;
        firebase.auth().signOut().then(function() {
            console.log("Current user logout");
            console.log(firebase.auth().currentUser);
            _this.nav.setRoot(HomePage);
        })
            .catch(function(error) {
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log(errorCode);
                console.log(errorMessage);
                console.log("test");
            });


    }


}
