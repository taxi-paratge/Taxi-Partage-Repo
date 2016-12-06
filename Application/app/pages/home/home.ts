import { Component } from '@angular/core';
import { NavController, Platform, AlertController, Slides } from 'ionic-angular';
import {LoginPage} from '../login/login';
import {LogoutPage} from '../logout/logout';
import { PaymentMethodPage } from '../payment-method/payment-method';
import {RideShareRequestPage} from "../ride-share-request/ride-share-request";
import {RideRequestPage} from "../ride-request/ride-request";
declare var google: any;
declare var firebase: any;
declare var $: any;


@Component({
    templateUrl: 'build/pages/home/home.html',
})
export class HomePage {

    // map height
    private mapHeight: number = 480;

    // show - hide booking form
    private showForm: boolean = false;

    // show - hide modal bg
    private showModalBg: boolean = false;

    // Note to driver
    private note: any;

    // Promo code
    private promo: any;

    // Map
    private map: any;

    private fromValue: string;
    private toValue: string;
    private departPlace: any;
    private destinationPlace: any;
    private userPosition: any;
    private userMarker: any;
    private listShareRideRequest: any[];
    private latlngDepart: any;
    private latlngDestination: any;
    private courseType: string;
    private rideId: string;

    private marker: any;
    private i: any;
    private tabmarkers: any;
    private availableCars: any;
    private availableCars1: any;
    private currentPosGPS: any;
    private allVehicules: any;
    private tabObjCars: any;
    private paiementType: any;

    private ridePrice: any;
    private rideDistance: any;
    private travelTime: any;
    constructor(private nav: NavController, private platform: Platform, private alertCtrl: AlertController) {

        let test = null;
        //let _this = this;
        this.paiementType = { type: "cash", text: "Argent Comptant", icon: "cash" }
        if (firebase.auth().currentUser == null) {
            this.loginUser();
        }
        else {
            //window.location.reload(true)
            this.userPosition = { lat: 0, lng: 0 }; //Position actuelle du user
            this.ridePrice = 0;
            // Adresse de depart et d'arrivée
            this.fromValue = "";
            this.toValue = "";
            this.listShareRideRequest = [];
            this.courseType = "single";
            // We load the shareRideRequest
            this.loadShareRideRequest();

            // when platform ready, init map
            platform.ready().then(() => {
                // init map
                this.initializeMap();
            });
            this.availableCars = {};
            this.tabObjCars = {};
            this.availableCars1 = null;
            this.currentPosGPS = 0;
            this.i = 0;
            this.tabmarkers = [];
            this.userPosition = { lat: 0, lng: 0 }; //Position actuelle du user

            // Adresse de depart et d'arrivée
            this.fromValue = "";
            this.toValue = "";
            this.listShareRideRequest = [];
            this.courseType = "single";
            // We load the shareRideRequest
            this.loadShareRideRequest();

            // Listen to paiement type
            if (firebase.auth().currentUser) {
                this.listenToPaiementType();
            }
        }
    }

    loginUser() {
        //$location.path('/HomePage');
        this.nav.push(LoginPage);
    }
    // toggle form
    toggleForm() {
        this.showForm = !this.showForm;
        this.showModalBg = (this.showForm == true);
    }

    initializeMap() {
        let self = this;

        let options = { timeout: 120000, enableHighAccuracy: true };
        // This function only works when we are using a browser
        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.currentPosGPS = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                // We update user center point
                self.userPosition = { lat: self.userPosition.lat, lng: self.userPosition.lng };
                this.map.setCenter(this.currentPosGPS);
            },
            (error) => {
            },
            options
        );

        let latLng = new google.maps.LatLng(45.503297, -73.618820);

        let mapOptions = {
            center: latLng,
            zoom: 14,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            zoomControl: false,
            streetViewControl: false
        }

        this.map = new google.maps.Map(document.getElementById("map"), mapOptions);

        this.userMarker = new google.maps.Marker({
            map: this.map,
            draggable: true,
            animation: google.maps.Animation.DROP,
            position: this.map.getCenter()
        });

        //Update  user position on drag
        google.maps.event.addListener(this.userMarker, 'drag', function(ev) {
            self.userPosition.lat = self.userMarker.getPosition().lat();
            self.userPosition.lng = self.userMarker.getPosition().lng();
        });
        //Dragging the map
        google.maps.event.addListener(this.map, 'drag', function() {
            self.userMarker.setPosition(self.map.getCenter())
            self.userPosition.lat = self.userMarker.getPosition().lat();
            self.userPosition.lng = self.userMarker.getPosition().lng();
            self.availableCars = {}
            for (let key in self.tabObjCars) {
                self.tabObjCars[key].setMap(null);
            }
            self.tabObjCars = {};
        });

        //this.getVehiculeProximite(undefined,undefined);

        this.getVehiculeProximite(this.userPosition.lat, this.userPosition.lng)

        //get ion-view height
        var viewHeight = window.screen.height - 44; // minus nav bar
        // get info block height
        var infoHeight = document.getElementsByClassName('booking-info')[0].scrollHeight;
        // get booking form height
        var bookingHeight = document.getElementsByClassName('booking-form')[0].scrollHeight;

        // set map height = view height - info block height + booking form height
        this.mapHeight = viewHeight - infoHeight + bookingHeight;

        // refresh map
        setTimeout(() => {
            google.maps.event.trigger(this.map, 'resize');
        }, 300);
    }

    // Fonction qui retourne les vehicules en proximite dependamment de la postion
    // Par defaut centrer à ludem
    getVehiculeProximite(lat = 45.503297, long = -73.618820) {
        let self = this;


        let url = 'https://stripepool.herokuapp.com/getVehiculeProximite'

        let body = { latitude: lat, longitude: long, radius: 5.0, limit: 5 }
        var image = "img/Sedan-52.png";
        $.ajax({
            url: url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            },
            type: 'POST',
            data: body,
            //dataType:'json',
            success: function(data) {
                self.availableCars = data.body
                for (var i in self.availableCars.Vehicles) {
                    let carResponseI = self.availableCars.Vehicles[i];
                    var LatLng = { lat: carResponseI.latitude, lng: carResponseI.longitude };
                    let objCar = { id: carResponseI.id, latlng: carResponseI.LatLng }

                    if (carResponseI.id in self.tabObjCars) {
                        self.tabObjCars[carResponseI.id].setPosition(LatLng)
                    } else {
                        let marker = new google.maps.Marker({
                            position: LatLng,
                            map: self.map,
                            draggable: false,
                            icon: image,
                            title: 'Taxi'
                        });
                        self.tabObjCars[carResponseI.id] = marker;
                    }

                }
            },

            error: function(data) {
            }
        });
        setTimeout(function() { self.getVehiculeProximite(self.userPosition.lat, self.userPosition.lng); console.log("lat:" + self.userPosition.lat + "long :" + self.userPosition.lng) }, 3000)
    }


    // Show note popup when click to 'Notes to driver'
    showNotePopup() {
        let prompt = this.alertCtrl.create({
            title: 'Notes to driver',
            message: "",
            inputs: [
                {
                    name: 'note',
                    placeholder: 'Note'
                },
            ],
            buttons: [
                {
                    text: 'Cancel',
                    handler: data => {
                    }
                },
                {
                    text: 'Save',
                    handler: data => {
                    }
                }
            ]
        });

        prompt.present();
    };

    // Show promote code popup when click to 'Promote Code'
    showPromoPopup() {
        let prompt = this.alertCtrl.create({
            title: 'Promo code',
            message: "",
            inputs: [
                {
                    name: 'note',
                    placeholder: 'Promo code'
                },
            ],
            buttons: [
                {
                    text: 'Cancel',
                    handler: data => {
                    }
                },
                {
                    text: 'Save',
                    handler: data => {
                    }
                }
            ]
        });

        prompt.present();
    };


    // choose payment method
    choosePaymentMethod() {
        // go to payment method page
        this.nav.push(PaymentMethodPage);
    }


    // Google Maps autoCompletion
    ngOnInit() {
        var defaultBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(45.5016889, -73.56725599999999),
            new google.maps.LatLng(46.8138783, -71.2079809));

        // get the two fields
        let input_from = (<HTMLInputElement>document.getElementById("journey_from"));
        let input_to = (<HTMLInputElement>document.getElementById("journey_to"));

        // set the options
        let options = {
            types: [],
            bounds: defaultBounds,
            componentRestrictions: { country: 'ca' },
            type: 'address'
        };

        // create the two autocompletes on the from and to fields
        let autocompleteFrom = new google.maps.places.Autocomplete(input_from, options);
        let autocompleteTo = new google.maps.places.Autocomplete(input_to, options);


        // we need to save a reference to this as we lose it in the callbacks
        let self = this;

        // add the first listener
        google.maps.event.addListener(autocompleteFrom, 'place_changed', function() {
            let place = autocompleteFrom.getPlace();
            let geometry = place.geometry;
            if ((geometry) !== undefined) {
                self.departPlace = place.formatted_address;
                self.latlngDepart = { lat: geometry.location.lat(), lng: geometry.location.lng() }
            }
        });

        // add the first listener
        google.maps.event.addListener(autocompleteTo, 'place_changed', function() {
            let place = autocompleteTo.getPlace();
            let geometry = place.geometry;
            if ((geometry) !== undefined) {
                self.destinationPlace = place.formatted_address;
                self.latlngDestination = { lat: geometry.location.lat(), lng: geometry.location.lng() }
            }
        });
    }

    // Map route configuration
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    initialize() {
        var chicago = new google.maps.LatLng(41.850033, -87.6500523);
        var mapOptions = {
            zoom: 7,
            center: chicago
        }
        this.directionsDisplay.setMap(this.map);
    }


    // Make a request for a route beetwen two routes and displays it on the map
    calcRoute() {
        this.directionsDisplay.setMap(this.map);
        let depart = this.departPlace;////document.getElementById('start').nodeValue;
        let destination = this.destinationPlace;//document.getElementById('end').nodeValue;
        var request = {
            origin: depart,
            destination: destination,
            travelMode: 'DRIVING'
        };
        let self = this;
        this.directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
            } else {
            }
        });
    }

    // Calculate route beetwen user and position
    calcRouteBetween() {
        this.directionsDisplay.setMap(this.map);
        let userPosition = this.userPosition;////document.getElementById('start').nodeValue;
        var request = {
            origin: userPosition,
            destination: userPosition,
            travelMode: 'DRIVING'
        };
        let self = this;
        this.directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                let routes = result.routes;
                let distance = routes[0].legs[0].distance.text;
                let duration = routes[0].legs[0].duration.text;
            } else {
            }
        });
    }


    // Hide the form booking when we click on annuler
    Cancelbooking() {
        this.toggleForm();
    }

    shareRide() {

        if (this.departPlace && this.destinationPlace) {
            this.saveShareRideRequest(this.departPlace, this.destinationPlace, this.latlngDepart, this.latlngDestination, firebase.auth().currentUser.uid);

            //Send the start and the end adresse to the RideShareRequestPage
            this.nav.push(RideShareRequestPage, { adresseStart: this.departPlace, adresseEnd: this.destinationPlace, latlngStart: this.latlngDepart, latlngEnd: this.latlngDestination, rideId: this.rideId, ridePrice: this.ridePrice, rideDistance: this.rideDistance });
        } else { // Erreur sur les adresses entrées
            let alertAdresseValide = this.alertCtrl.create({
                title: 'Erreur sur les adresses entrées',
                subTitle: 'Verifier les adresses de départ et destination',
                buttons: ['OK']
            });
            alertAdresseValide.present();
        }
    }
    indiduelRide() {

        if (this.departPlace && this.destinationPlace) {
            let infoToPass = { adresseStart: this.departPlace, adresseEnd: this.destinationPlace, latlngStart: this.latlngDepart, latlngEnd: this.latlngDestination, rideId: this.rideId }
            this.nav.push(RideRequestPage, { infoToPass: infoToPass });
            firebase.database().ref('Users/' + firebase.auth().currentUser.uid + "/currentCourse").set(true);


        } else { // Erreur sur les adresses entrées
            let alertAdresseValide = this.alertCtrl.create({
                title: 'Erreur sur les adresses entrées',
                subTitle: 'Verifier les adresses de départ et destination',
                buttons: ['OK']
            });
            alertAdresseValide.present();
        }
    }

    // Firebase save a shareRequest on the save request table
    saveShareRideRequest(adresseDepart, adresseDestination, latlngStart, latlngEnd, clientId) {
        // A post entry.

        let order = [adresseDepart, adresseDestination];

        // Get a key for a new Post.
        let newPostKey = firebase.database().ref().child('rideRequest').push().key;

        let directionsServiceSingle = new google.maps.DirectionsService();
        let self = this;
        let request = {
            origin: self.departPlace,
            destination: self.destinationPlace,
            travelMode: 'DRIVING',
            optimizeWaypoints: true
        };
        directionsServiceSingle.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                self.rideDistance = result.routes[0].legs[0].distance.text;
                self.travelTime = result.routes[0].legs[0].duration.text;

                // Nombre de kilomètres X 1,7 + 20% plus 1$
                let nbKm = (result.routes[0].legs[0].distance.value) / 1000;

                self.ridePrice = nbKm * 1.7;
                self.ridePrice += 0.2 * self.ridePrice + 1;
                self.ridePrice = Math.round(self.ridePrice * 100) / 100;

                // Adding the ride stats
                let rides = [{ adresseDepart, adresseDestination, clientId, latlngStart, latlngEnd, ridePrice: self.ridePrice, rideDistance: nbKm }];
                let postData = {
                    rides: rides,
                    rideOrder: order,
                    time: new Date().getTime(),
                };
                self.rideId = newPostKey;
                let updates = {};
                updates['/rideRequest/' + newPostKey] = postData;
                firebase.database().ref().update(updates);

            } else {
                // Write the simple post data if we can't get the.
                let rides = [{ adresseDepart, adresseDestination, clientId, latlngStart, latlngEnd }];
                let postData = {
                    rides: rides,
                    rideOrder: order,
                    time: new Date().getTime()
                };
                self.rideId = newPostKey;
                let updates = {};
                updates['/rideRequest/' + newPostKey] = postData;
                firebase.database().ref().update(updates);
            }
        });

    }
    // We load the rideshareRequest from firebase and put it in the the
    // listShareRideRequest array
    loadShareRideRequest() {
        let self = this;
        firebase.database().ref('rideRequest/').on('child_added', function(data) {
            self.listShareRideRequest.push(data.val());
        });
    }

    commande() {
        let self = this;
        firebase.database().ref('/Users/' + firebase.auth().currentUser.uid + "/currentCourse").once('value').then(function(snapshot) {
            let currentCourse = snapshot.val();
            if (!currentCourse) {

                if (self.courseType == 'shared') {
                    self.shareRide();

                } else {
                    //single ride
                    self.indiduelRide();
                }
            }
            else {
                let alertCurrentCourse = self.alertCtrl.create({
                    title: 'Course en cours!!',
                    subTitle: 'Vous avez déjà une course en cours.',
                    buttons: ['Annuler']
                });
                alertCurrentCourse.present();
            }
        });

    }

    logout() {
        this.nav.setRoot(LogoutPage);
    }

    listenToPaiementType() {
        let self = this
        firebase.database().ref('/Users/' + firebase.auth().currentUser.uid + '/card/').on('value', function(data) {
            let isCard = data.val()
            if (isCard) {
                self.paiementType = { type: "card", text: "Carte de crédit", icon: "card" }
            } else {
                self.paiementType = { type: "cash", text: "Argent Comptant", icon: "cash" }
            }
        });

    }
}
