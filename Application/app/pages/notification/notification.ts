/**
 * @summary Cette classe gère la logique de notification
 *
 * @author Equipe Whos.
 */

import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {RideShareViewPage} from "../ride-share-view/ride-share-view";
import {RideShareWaitPage} from "../ride-share-wait/ride-share-wait";

declare var firebase: any;

/*
  Generated class for the NotificationPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
    templateUrl: 'build/pages/notification/notification.html',
})
export class NotificationPage {
    private notificationsData: any;
    private notifications: any;

    // Our adresses
    private latlngStartClient: any;
    private latlngEndClient: any;

    constructor(private nav: NavController) {
        this.notificationsData = [];
        this.notifications = [];
        this.loadNotifications();
        this.listenNotificationToDeletion();

    }

    notifClicked(noti) {
        let index = this.notifications.indexOf(noti);
        this.nav.push(RideShareWaitPage, { rideToShare: this.notificationsData[index] });
    }

    loadNotifications() {
        let _this = this;
        let currentUserId = firebase.auth().currentUser.uid;
        firebase.database().ref('notificationShareRide/' + currentUserId).on('child_added', function(data) {
            let notif = data.val(); // ici
            notif.id = data.key;
            _this.notificationsData.push(notif);
            let ride = notif.rides;
            let title = _this.getOurAddresses(ride).adresseStart + " vers " + _this.getOurAddresses(ride).adresseEnd
            let content = "Partage de Course"
            _this.notifications.push(_this.buildNotification(title, content));
        });
    }


    listenNotificationToDeletion() {
        let _this = this;
        let currentUserId = firebase.auth().currentUser.uid;
        firebase.database().ref('notificationShareRide/' + currentUserId).on('child_removed', function(data) {
            let notif = data.val(); // ici

            console.log("Notification supprimé")
            notif.id = data.key;
            let ride = notif.rides;
            let title = _this.getOurAddresses(ride).adresseStart + " vers " + _this.getOurAddresses(ride).adresseEnd
            let content = "ABCDE"
            let index = _this.notifications.indexOf(_this.buildNotification(title, content));
            console.log("index notif supp :" + index)
            if (index > -1) {
                _this.notifications.splice(index, 1);
            }

        });
    }


    getOurAddresses(rideArray) {
        let adresses = { adresseStart: 'Blabla', adresseEnd: 'Blabla' }
        for (let i = 0; i < rideArray.length; i++) {
            console.log("i = " + i)
            console.log(rideArray[i])
            if (rideArray[i].clientId == firebase.auth().currentUser.uid) {
                let splittedAdressStart = rideArray[i].adresseDepart.split(',')[0]
                let splittedAdressEnd = rideArray[i].adresseDestination.split(',')[0]
                adresses = { adresseStart: splittedAdressStart, adresseEnd: splittedAdressEnd };
            }
        }
        return adresses;
    }


    buildNotification(title, content) {
        let notif = {
            id: 1,
            title: title,
            content: "Utilisateur_1 veut partager une course avec vous",
            createdAt: content,
            read: false
        }
        return notif;
    }
}
