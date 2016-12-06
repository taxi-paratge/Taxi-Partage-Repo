/**
 * @summary Cette classe gère la vue de paiement
 *
 * @author Equipe Whos.
 */

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {LoginPage} from '../login/login';
import {HomePage} from "../home/home";
import {CreditCardPage} from '../creditcard-view/creditcard-view';
declare var Stripe: any;
declare var firebase: any;
declare var $: any;

/*
 Generated class for the RegisterPage page.
 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
    templateUrl: 'build/pages/paiement-view/paiement-view.html',
})
export class PaiementPage {
    private userPaiementInfos: any

    constructor(private nav: NavController) {
        this.userPaiementInfos = []
        if (firebase.auth().currentUser) {
            this.loadPaiementInfo()
        }
    }

    signup() {
        this.nav.setRoot(HomePage);
    }

    login() {
        this.nav.setRoot(LoginPage);
    }

    addPaymentMethod() {
        this.nav.push(CreditCardPage);
    }

    loadPaiementInfo() {
        let self = this;
        firebase.database().ref('/paiementInfo/' + firebase.auth().currentUser.uid).once('value', function(data) {
            if (data.val()) {
                let ccNumber = data.val().carteCredit
                let clientStripeId = data.val().clientStripeId
                self.userPaiementInfos.push({ creditCardNumber: ccNumber, clientStripeId: clientStripeId })
            }
        })
    }

    chargeClient() {
        let url = 'https://stripepool.herokuapp.com/charge'

        firebase.database().ref('/paiementInfo/' + firebase.auth().currentUser.uid).once('value', function(data) {
            let stripeCustomerId = data.val().clientStripeId

            let body = {
                customerId: stripeCustomerId,
                amount: 2000
            }

            console.log(body)
            $.ajax({
                url: url,
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
                },
                type: 'POST',
                data: body,
                success: function(data) {
                    console.log(data)
                },
                error: function(data) {
                    console.log(data)
                }
            });
        });
    }
}
