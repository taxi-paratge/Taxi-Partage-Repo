/**
 * @summary Cette classe gère l'inscription
 *
 * @author Equipe Whos.
 */

import { Component, Injectable } from '@angular/core';
import { NavController, Platform, AlertController } from 'ionic-angular';
import {LoginPage} from '../login/login';
import {HomePage} from "../home/home";
import {confirmAccountPage} from "../confirmAccount/confirmAccount";
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
    templateUrl: 'build/pages/register/register.html',
})

export class RegisterPage {

  private emailValue : any;
  private passwordValue : any;
  private confirmPasswordValue : any;
  private firstNameValue : any;
  private lastNameValue : any;
  private phoneValue : any;

    constructor(private nav: NavController, private alertCtrl: AlertController,private http: Http) {
      let phone = this.phoneValue;
    }

    signup() {
        // console.log("bizarre");
        // let email = this.emailValue;
        // let password = this.passwordValue ;
        // let confirmPassword = this.confirmPasswordValue;
        // let firstName = this.firstNameValue;
        // let lastName = this.lastNameValue;
        // let phone = this.phoneValue;
        let confirmedAccount = false;
        let code = Math.floor(Math.random()*90000) + 10000;
        let _this = this;

        firebase.auth().createUserWithEmailAndPassword(this.emailValue, this.passwordValue).then(function() {
            //register succeed
            let user = firebase.auth().currentUser;
            _this.saveUserOnDatabase(user.uid, _this.emailValue, _this.passwordValue, _this.firstNameValue, _this.lastNameValue, _this.phoneValue, confirmedAccount, code);
            _this.nav.setRoot(confirmAccountPage);
        })
            .catch(function(error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                console.log("Erreur ici");
                console.log(errorCode);
                console.log(errorMessage);
                // ...
                let titleDisplay = "Erreur"
                let erreurDisplay
                titleDisplay = errorCode;
                erreurDisplay = errorMessage;
                let alert = _this.alertCtrl.create({
                    title: titleDisplay,
                    subTitle: erreurDisplay,
                    buttons: ['OK']
                });
                alert.present();
            });
            $.ajax({
                url: "https://api.twilio.com/2010-04-01/Accounts/AC48435ac167223f1daade8c3a8fa9f47c/Messages.json",
                beforeSend: function(xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa("AC48435ac167223f1daade8c3a8fa9f47c:de14705eb8623ce06cd859d8ecc046c3"));
                },
                type: 'POST',
                dataType: 'json',
                //contentType: 'application/json',
                //processData: false,
                data: {
                    To: _this.phoneValue,
                    From: "(514) 667-9417",
                     Body: 'Votre code verification est: ' + code
                },
                success: function(data) {
                    console.log("Message envoyé")
                },
                error: function(data) {
                    var err= data['responseText'];
                    err= JSON.parse(err);
                    alert(err["message"]);
                }
            });
            let user = firebase.auth().currentUser;
    }

    onteste()
    {
      console.log("Erreur ici");
    }


    saveUserOnDatabase(userId, email, password, firstName, lastName, phone,confirmedAccount, code) {

        var postData = {
            email: email,
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            confirmedAccount: confirmedAccount,
            code: code,
            currentCourse:false
        };
        // Get a key for a new Post.
        //var newPostKey = firebase.database().ref().child('Users').push().key;
        // Write the new post's data simultaneously in the posts list and the user's post list.
        var updates = {};
        updates['/Users/' + userId] = postData;
        firebase.database().ref().update(updates);
    }

/*  sendSmsTwilioAPI() {
        let phone = (<HTMLInputElement>document.getElementById("phone"));
        $.ajax({
            url: "https://api.twilio.com/2010-04-01/Accounts/AC48435ac167223f1daade8c3a8fa9f47c/Messages.json",
            beforeSend: function(xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa("AC48435ac167223f1daade8c3a8fa9f47c:de14705eb8623ce06cd859d8ecc046c3"));
            },
            type: 'POST',
            dataType: 'json',
            //contentType: 'application/json',
            //processData: false,
            data: {
                To: phone.value,
                From: "(514) 667-9417",
                Body: "ca marche :) "
            },
            success: function(data) {
                alert(JSON.stringify("Message envoyé"));
            },
            error: function(data) {
                console.log(data['responseText']);
                alert("Cannot get data");
            }
        });*/

        /*let headers = new Headers({'Content-Type': 'application/json'});
        let options =  new RequestOptions ({ headers: headers});
        //headers.append("To","+15149742704");
        //headers.append("From","+15146679417");
        //headers.append("Body","Salut");
        let body = JSON.stringify({To: "+15149742704", From: "+15146679417", Body: "Salut"});
        var search = new URLSearchParams();
        search.set('To','+15149742704');
        search.set('From','+15146679417');
        search.set('Body','Salut');
        let url = "https://api.twilio.com/2010-04-01/Accounts/AC48435ac167223f1daade8c3a8fa9f47c/Messages.json";
        this.http.post(url, {search}, options).map((res:Response)=>res.json())
        .catch((error:any)=>Observable.throw(error.json().error || 'server.error'));
        console.log("sendSMS");
        console.log(body);*/

    //}
    login() {
       console.log(this.emailValue);
      // alert.present(this.emailValue);
        this.nav.setRoot(LoginPage);
    }
}
