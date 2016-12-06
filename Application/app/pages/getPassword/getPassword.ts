/**
 * @summary Cette classe représente la page qui permet a l'utilisateur de recuperer son mot de passe en cas d'oubli.
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
    templateUrl: 'build/pages/getPassword/getPassword.html',
})

export class getPasswordPage {
    constructor(private nav: NavController, private http: Http, private alertCtrl: AlertController) {
    }

    sendingPasswordResetEmails() {
        let email = (<HTMLInputElement>document.getElementById("email"));
        let _this = this;
        firebase.auth().sendPasswordResetEmail(email.value).then(function() {
            _this.nav.setRoot(LoginPage);

        })
            .catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
            });
    }

}
