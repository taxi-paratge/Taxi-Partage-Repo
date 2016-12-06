/**
 * @summary Cette classe représente la page d'ajout d'une carte de credit au compte de l'utilisateur.
 * Cette carte sera validée à l'aide de stripe par requete envoyee au serveur.
 *
 * @author Equipe Whos.
 */

import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';
import { Http, Response, Headers, RequestOptions, RequestMethod, Request, URLSearchParams } from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

declare var Stripe: any;
declare var firebase: any;
declare var $: any;

@Component({
    templateUrl: 'build/pages/creditcard-view/creditcard-view.html',
})
export class CreditCardPage {
    private creditcardnumber: any;
    private monthyear: any;
    private cvv: any;

    constructor(private nav: NavController, private http: Http, private alertCtrl: AlertController) {
        this.creditcardnumber = ""
        this.monthyear = ""
        this.cvv = ""
    }

    addCard() {
        if (this.creditcardnumber.length != 16 || this.monthyear.length != 4 || this.cvv.length != 3) {
            let creditCardInvalid = this.alertCtrl.create({
                title: 'Erreur sur les données entrées',
                subTitle: 'Verifier les informations de votre carte',
                buttons: ['OK']
            });
            creditCardInvalid.present();
            return;
        }
        let month = parseInt(this.monthyear.substring(0, 2))
        let year = parseInt(this.monthyear.substring(2, 4))

        let body = {
            clientId: firebase.auth().currentUser.uid,
            clientEmail: 'mouha.oumar@gmail.com',
            clientCardNumber: this.creditcardnumber,
            clientExpYear: year,
            clientExpMonth: month
        }

        let url = 'https://stripepool.herokuapp.com/new_user'
        //let url = 'http://localhost:5000/new_user'
        let self = this;
        $.ajax({
            url: url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            },
            type: 'POST',
            data: body,
            success: function(data) {
                if (data.status == 500) {
                    let alertInvalid = self.alertCtrl.create({
                        title: 'Erreur sur la carte',
                        subTitle: 'La carte de crédit invalide',
                        buttons: ['OK']
                    });
                    alertInvalid.present();

                } else {
                    let alertValid = self.alertCtrl.create({
                        title: 'Carte de crédit ajoutée',
                        subTitle: 'La carte de crédit a été ajoutée avec succés',
                        buttons: ['OK']
                    });
                    alertValid.present();
                }

            },
            error: function(data) {
            }
        });

    }


}
