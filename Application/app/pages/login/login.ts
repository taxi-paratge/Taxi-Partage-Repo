/**
 * @summary Cette classe représente la page de connexion. L'utilisateur doit entrer son email et son mot de passe qui seront validés dans la base de donnees.
 * Il pourra aussi appuyer sur le bouton s'enregistrer et le sera rediriger ver la page pour creer un compte, ou au besoin appuyer sur le bouton mot de passe
 * oublié pour etre rediriger vers la page de recuperation du mot de passe.
 *
 * @author Equipe Whos.
 */
 
import { Component } from '@angular/core';
import {RegisterPage} from '../register/register';
import {getPasswordPage} from '../getPassword/getPassword';
import {MyApp} from "../../app";
import {confirmAccountPage} from '../confirmAccount/confirmAccount';
import { NavController, Platform, AlertController } from 'ionic-angular';
import { SMS } from 'ionic-native';
import {HomePage} from '../home/home'


declare var firebase: any;

@Component({
    templateUrl: 'build/pages/login/login.html',
})
export class LoginPage {

    private emailUsernameValue: any;
    private passValue: any;
    private currentUserName: string;

    constructor(private nav: NavController, private alertCtrl: AlertController) {
        this.passValue = ""
        this.emailUsernameValue = ""
    }

    signup() {
        this.nav.setRoot(RegisterPage);
    }
    forgotMotDePasse() {
        this.nav.setRoot(getPasswordPage);
    }

    login() {
        let username = this.emailUsernameValue //(<HTMLInputElement>document.getElementById("username"));
        let password = this.passValue //(<HTMLInputElement>document.getElementById("password"));
        let _this = this;
        let compteConfirme;
        var db = firebase.database();
        var ref = db.ref("Users");
        ref.orderByChild("email").equalTo(username).on("child_added", function(snapshot) {
            //savedCode = snapshot.val().code;
            compteConfirme = snapshot.val().confirmedAccount;

            if (compteConfirme == true) {
                firebase.auth().signInWithEmailAndPassword(username, password).then(function() {
                    //connexion reussie
                    _this.currentUserName = firebase.auth().currentUser.email;
                    _this.nav.setRoot(HomePage);
                })
                    .catch(function(error) {
                        // Handle Errors here
                        var errorCode = error.code;
                        //auth/wrong-password
                        //auth/user-not-found
                        var errorMessage = error.message;
                        let titleDisplay = "Erreur"
                        let erreurDisplay = errorMessage
                        if (errorCode == 'auth/wrong-password') {
                            titleDisplay = "Erreur sur le  Mot de passe"
                            erreurDisplay = 'Veuillez verifier le mot de passe entré'
                        } else if (errorCode == 'auth/user-not-found') {
                            titleDisplay = "Erreur sur les identifiants"
                            erreurDisplay = 'Informations incorrects, veuillez verifier les informations entrées'
                        } else if (errorCode == 'auth/invalid-email') {
                            titleDisplay = "Erreur sur le courriel "
                            erreurDisplay = "Veuillez verifier le courriel entré"
                        }
                        let alert = _this.alertCtrl.create({
                            title: titleDisplay,
                            subTitle: erreurDisplay,
                            buttons: ['OK']
                        });
                        alert.present();
                    });
            }
            else {
                let titleDisplay = "Erreur"
                let erreurDisplay
                titleDisplay = "Compte non confirmé"
                erreurDisplay = 'Veuillez verifier votre compte'
                let alert = _this.alertCtrl.create({
                    title: titleDisplay,
                    subTitle: erreurDisplay,
                    buttons: ['OK']
                });
                alert.present();
                this.nav.setRoot(confirmAccountPage);
            }
        });

    }
}
