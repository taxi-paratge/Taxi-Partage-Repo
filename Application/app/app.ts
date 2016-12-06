import {Component} from '@angular/core';
import {Platform, ionicBootstrap, AlertController} from 'ionic-angular';
import {ViewChild} from '@angular/core';
import {StatusBar} from 'ionic-native';

// import pages
import {LoginPage} from './pages/login/login';
import {ProfilePage} from './pages/profile/profile';
import {LogoutPage} from './pages/logout/logout';
import {RegisterPage} from './pages/register/register';
import {HomePage} from './pages/home/home';
import {PaymentMethodPage} from './pages/payment-method/payment-method';
import {HistoryPage} from './pages/history/history';
import {NotificationPage} from './pages/notification/notification';
import {RideShareRequestPage} from './pages/ride-share-request/ride-share-request';
import {RideShareViewPage} from './pages/ride-share-view/ride-share-view';
import {RideShareWaitPage} from './pages/ride-share-wait/ride-share-wait';
import {PaiementPage} from './pages/paiement-view/paiement-view';
//import {LoadingModal} from './pages/loading-modal/loading-modal';

declare var firebase: any;

@Component({
    templateUrl: 'build/app.html',
    queries: {
        nav: new ViewChild('content')
    }
})
export class MyApp {

    private rootPage: any;

    private nav: any;

    private pages = [
        {
            title: 'Accueil',
            icon: 'ios-home-outline',
            count: 0,
            component: HomePage
        },
        {
            title: 'Historique',
            icon: 'ios-time-outline',
            count: 0,
            component: HistoryPage
        },
        {
            title: 'Notification',
            icon: 'ios-notifications-outline',
            count: 1,
            component: NotificationPage
        },
        /*{
          title: 'Aide',
          icon: 'ios-help-circle-outline',
          count: 0,
          component: SupportPage
        },*/
        {
            title: 'Course Partagée',
            icon: 'car',
            count: 0,
            component: RideShareRequestPage
        },
        {
            title: 'Paiement',
            icon: 'card',
            count: 0,
            component: PaiementPage
        },
        {
            title: 'Deconnexion',
            icon: 'ios-log-out-outline',
            count: 0,
            component: LogoutPage
        }
    ];

    private currentUser: any;
    private currentUserName: string;
    constructor(private platform: Platform, private alertCtrl: AlertController) {
        //  window.location.reload(true);
        //window.refresh(true);
        this.rootPage = HomePage;
        let _this = this;
        this.currentUserName = "";
        platform.ready().then(() => {
            // Okay, so the platform is ready and our plugins are available.
            // Here you can do any higher level native things you might need.
            if (firebase.auth().currentUser == null) {
                _this.currentUserName = "";
            }
            else {
                _this.currentUser = firebase.auth().currentUser;
                _this.currentUserName = firebase.auth().currentUser.email;
                _this.listenToNotification();
                StatusBar.styleDefault();
            }
        });

    }

    openPage(page) {
        // Reset the content nav to have just this page
        // we wouldn't want the back button to show in this scenario
        //this.nav.setRoot(page.component);
        if (page.component == this.rootPage) {
            this.nav.popToRoot();
        } else {
            this.nav.push(page.component);
        }
    }

    // We listen to new notification regarding ride sharing
    listenToNotification() {
        let _this = this;
        let currentUserId = firebase.auth().currentUser.uid;
        firebase.database().ref('/notificationShareRide/' + firebase.auth().currentUser.uid).on('child_added', function(data) {
            let ride = data.val();
            ride.id = data.key;
            let alert = _this.alertCtrl.create({
                title: 'Partage de course',
                message: 'Un utilisateur veut partager sa course avec vous.',
                buttons: [
                    {
                        text: 'Annuler',
                        role: 'cancel',
                        handler: () => {
                            console.log('Annuler clicked');
                        }
                    },
                    {
                        text: 'Voir',
                        handler: () => {
                            console.log('Voir clicked');
                            _this.nav.push(NotificationPage);
                        }
                    }
                ]
            });
            alert.present();

        });
    }

    forgotMotDePasse() {
        console.log("profile");
        this.nav.push(ProfilePage);
    }
}

ionicBootstrap(MyApp, [])
