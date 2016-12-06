/**
 * @summary Cette classe gère les méthodes de paiement
 *
 * @author Equipe Whos.
 */

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

declare var firebase: any;

/*
  Generated class for the PaymentMethodPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
    templateUrl: 'build/pages/payment-method/payment-method.html',
})
export class PaymentMethodPage {

    private creditCardNumber: any
    constructor(private nav: NavController) {
        this.creditCardNumber = "";
        if (firebase.auth().currentUser) {
            this.loadPaiementInfo()
        }
    }

    // apply change method
    changeMethod(type) {
        console.log('fep');
        console.log("type " + type)
        // go back
        if (type == "cash") {
            // update pref in Users/uid/card
            firebase.database().ref('/Users/' + firebase.auth().currentUser.uid + '/card').set(false)
        } else if (type == "card") {
            firebase.database().ref('/Users/' + firebase.auth().currentUser.uid + '/card').set(true);
        }
        console.log(this.creditCardNumber)
        this.nav.pop();
    }

    loadPaiementInfo() {
        let self = this;
        firebase.database().ref('/paiementInfo/' + firebase.auth().currentUser.uid).once('value', function(data) {
            if (data.val()) {
                let ccNumber = data.val().carteCredit
                let clientStripeId = data.val().clientStripeId
                console.log(data.val())
                console.log(ccNumber)
                console.log(clientStripeId)
                self.creditCardNumber = ccNumber;
                //self.userPaiementInfos.push({creditCardNumber: ccNumber, clientStripeId:clientStripeId})
            }
        })
    }
}
