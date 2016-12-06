/**
 * @summary Cette classe gère le profile de l'utilisateur
 *
 * @author Equipe Whos.
 */
import { Component } from '@angular/core';
import {RegisterPage} from '../register/register';
import {getPasswordPage} from '../getPassword/getPassword';
import {changePasswordPage} from '../changePassword/changePassword';
import {confirmAccountPage} from '../confirmAccount/confirmAccount';
import { NavController, Platform, AlertController } from 'ionic-angular';
import { SMS } from 'ionic-native';
import {HomePage} from '../home/home'
declare var firebase: any;

/*
  Generated class for the ProfilePage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/profile/profile.html',
})
export class ProfilePage {
  private currentUserName: string;
  private currentUser: any;
  private currentUserLastName: any;
  private currentUserFirstName: any;
  private currentUserPhoneNumber: any;
//  private currentUserlastName: string;
  constructor(private nav: NavController, private alertCtrl: AlertController)
  {
    let _this = this;
          console.log("ici");
          this.currentUser = firebase.auth().currentUser;
          this.currentUserName = firebase.auth().currentUser.email;
          firebase.database().ref("Users/"+firebase.auth().currentUser.uid).once("value",function(data){
             _this.currentUserLastName = data.val().lastName;
              _this.currentUserFirstName = data.val().firstName;
              _this.currentUserPhoneNumber = data.val().phone;
          });
  }

  changeMotDePasse()
  {
      firebase.auth().sendPasswordResetEmail(firebase.auth().currentUser.email).then(function() {
        console.log(firebase.auth().currentUser.email);
      })
          .catch(function(error) {
              // Handle Errors here.
              var errorCode = error.code;
              var errorMessage = error.message;
              console.log("Erreur ici");
              console.log(errorCode);
              console.log(errorMessage);

          });
          let alert = this.alertCtrl.create({
              title: 'Changement de mot de passe',
              subTitle: 'Veuillez verifier votre email. Un mail de changement de mot de passe vous a été envoyé',
              buttons: ['OK']
          });
          alert.present();
    }

    changeProfile()
    {

      var db = firebase.database();
      var ref = db.ref("Users");
      let user = firebase.auth().currentUser;
      let _this = this
      //console .log(firstname);
      ref.orderByChild("email").equalTo(user.email).on("child_added", function(snapshot) {
          console.log(user.email);
          console.log(_this.currentUserLastName);
            firebase.database().ref('Users/' + firebase.auth().currentUser.uid + "/firstName").set(_this.currentUserFirstName);
            firebase.database().ref('Users/' + firebase.auth().currentUser.uid + "/lastName").set(_this.currentUserLastName);
            firebase.database().ref('Users/' + firebase.auth().currentUser.uid + "/phone").set(_this.currentUserPhoneNumber);
            _this.nav.setRoot(HomePage);
      });
    }

  }
