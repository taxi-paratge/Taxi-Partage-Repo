/**
 * @summary Cette classe représente la page da la quelle l'utilisateur est redirigé
 * lorsqu'il partage une course pu si quelqu'un partage une course avec lui.
 * L'utilisateur peut annuler la course, dans ce cas il sera rediriger vers la page de partage.
 *Il peut demander demarrer la course immediatement, dans ce cas il doit attendre que les autres
 * utilisateurs presents dans la course acceptent si le nombre total de client < 4.
 * La course demarera automatiquement s'il y a 4 clients.
 *
 * @author Equipe Whos.
 */

import { Component, ViewChild, Injectable } from '@angular/core';
import { NavController, NavParams, Platform, AlertController, LoadingController, Slides } from 'ionic-angular';
import { Http, Response, Headers, RequestOptions, RequestMethod, Request, URLSearchParams } from '@angular/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import { Course } from '../geo-coder/course';
import { Geo } from '../geo-coder/geo';
import { Adresse } from '../geo-coder/adresse';
import { Location } from '../geo-coder/location';
import { Usager } from '../geo-coder/usager';
declare var google: any;
declare var $: any;
declare var firebase: any;
@Injectable()

/*
Generated class for the RideShareRequestPage page.

See http://ionicframework.com/docs/v2/components/#navigation for more info on
Ionic pages and navigation.
*/
@Component({
    templateUrl: 'build/pages/ride-share-wait/ride-share-wait.html',
})
export class RideShareWaitPage {

    //Slider
    @ViewChild('mapSlider') slider: Slides;

    // Map
    private map: any;

    // Map div Id
    private mapSlide: string;

    //client AdresseDep et adresseEnd
    private adresseStartClient: string;
    private adresseEndClient: string;
    private latlngStartClient: any;
    private latlngEndClient: any;

    private passagerActuel: any;
    private passagerToGo: any;
    private passagerToGoArrayId: any;


    // map height
    private mapHeight: number = 480;

    private rideOrder: any;
    private rides: any;
    private rideId: any;
    private jsonString: any;

    private loading: any;

    private alert: any;
    private tabmarkers: any;
    private usagersJson: any;
    private sharedRidePrice:any;
    private sharedRideDistance:any;
    constructor(private nav: NavController, private platform: Platform, private navParams: NavParams, private http: Http, private loadingCtrl: LoadingController, private alertCtrl: AlertController) {

        // when platform ready, init map
        this.mapSlide = "mapSlide_1";
        this.rideOrder = navParams.get('rideToShare').rideOrder;
        this.rides = navParams.get('rideToShare').rides;
        this.rideId = navParams.get('rideToShare').id;
        console.log("rides in constructor")
        console.log(this.rides);
        // Getting the user start and end adress
        this.latlngStartClient = this.getOurLatLongAddresses(this.rides).latlngStart;
        this.latlngEndClient = this.getOurLatLongAddresses(this.rides).latlngEnd;

        this.adresseStartClient = this.getOurAddresses(this.rides).adresseStart;
        this.adresseEndClient = this.getOurAddresses(this.rides).adresseEnd;

        console.log("currentPos in constructor")
        console.log(this.latlngStartClient);

        this.passagerActuel = this.rides.length
        this.passagerToGo = 0;
        this.passagerToGoArrayId = [];
        this.tabmarkers = [];
        platform.ready().then(() => {
            console.log('ready');
            // init map
            let resultRequest = this.buildRouteRequest(this.rideOrder);
            this.initializeMap("mapSlide_1", resultRequest.adresseStart, resultRequest.adresseEnd, resultRequest.waypoints, this);
            console.log("Inside platform.ready()");
            console.log(this.mapSlide);
        });

        this.listenToPassagerToGo();
        this.listenToVehiculeAssigned();
        this.listenToNewClientJoin();
        this.listenToUserCancelation();
    }


    initializeMap(idMap, origin, destination, waypoints, self) {
        let latLng = new google.maps.LatLng(45.50561560000001, -73.6137592);
        let mapOptions = {
            center: latLng,
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: true,
            zoomControl: false,
            draggable: true,
            streetViewControl: false

        }
        self.map = new google.maps.Map(document.getElementById(idMap), mapOptions);
        let options = { timeout: 120000, enableHighAccuracy: true };

        // refresh map
        setTimeout(() => {
            google.maps.event.trigger(this.map, 'resize');
        }, 300);

        self.drawSharedRoute(origin, destination, waypoints, self);
    }


    // Map route configuration
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    // Itenary_object : origin, destination, String[] waypoints
    drawSharedRoute(origin, destination, waypoints, self) {
        self.directionsDisplay.setMap(self.map);
        let userPosition = 0;
        let taxiPosition = 0;
        let request = {};
        if (waypoints) {
            request = {
                origin: origin,
                destination: destination,
                travelMode: 'DRIVING',
                waypoints: waypoints,
                optimizeWaypoints: true
            };
        } else {
            request = {
                origin: origin,
                destination: destination,
                travelMode: 'DRIVING',
                optimizeWaypoints: true
            };
        }
        self.directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                let routes = result.routes;
                let distance = routes[0].legs[0].distance.text;
                let duration = routes[0].legs[0].duration.text;
                console.log(result);
                console.log(distance);
                console.log(duration);
            } else {
                console.log("Error: drawSharedRoute()")
            }
        });
    }

    // Take a route step and build a route request: start, end , waypoints
    buildRouteRequest(routeStep) {
        let adresseStart = routeStep[0];
        let adresseEnd = routeStep[routeStep.length - 1];
        let waypoints = [];
        for (let i = 1; i < routeStep.length - 1; i++) {
            waypoints.push({ location: routeStep[i] });
        }
        return { adresseStart: adresseStart, adresseEnd: adresseEnd, waypoints: waypoints }
    }

    startRide() {
        this.showLoading(this.passagerToGo);
        console.log(this.buildRouteRequest(this.rideOrder));
        this.mergeRides(this.rides, this.rideOrder, this.rideId);
        this.deleteOldRides(this.rides);

        /* Increment passagerToGo in currentRideShare/rideShareId
        -rides
            - rideOrder
            - passagerToGo*/

        console.log("The ride Id is : " + this.rideId)
        this.verifyCurrentRideShare(this.rideId, this.rides, this.rideOrder)

    }


    showLoading(passagerToGo) {
        let self = this;
        self.loading = self.loadingCtrl.create({
            content: passagerToGo + " / " + self.passagerActuel + " passagers sont prêts à partir",
            duration: 3000
        })
        self.loading.present()
    }
    deleteOldRides(rides) {
        for (let i = 0; i < rides.length; i++) {
            let rideId = rides[i].rideId;
            firebase.database().ref('rideRequest/' + rideId).remove();

        }
    }


    // Firebase
    verifyCurrentRideShare(rideShareRequestId, rides, rideOrder) {
        //Update the list of share rides

        firebase.database().ref('currentRideShare/' + rideShareRequestId).once('value', function(data) {
            console.log("data val")
            console.log(data.val())
            if (data.val()) {
                // add ourself to passagerToGo
                console.log("exist")
                firebase.database().ref('currentRideShare/' + rideShareRequestId + '/passagerToGo' + '/' + firebase.auth().currentUser.uid).set(true);
            } else {
                console.log("don't exist")
                // create and add ourself
                var postData = {
                    rides: rides,
                    rideOrder: rideOrder,
                };
                var updates = {};
                updates['/currentRideShare/' + rideShareRequestId] = postData;
                firebase.database().ref().update(updates);
                // We add ourself to passagerToGo
                firebase.database().ref('currentRideShare/' + rideShareRequestId + '/passagerToGo' + '/' + firebase.auth().currentUser.uid).set(true);

            }
        });
    }

    listenToPassagerToGo() {
        let self = this
        firebase.database().ref('currentRideShare/' + this.rideId + '/passagerToGo').on('child_added', function(data) {
            self.passagerToGo = self.passagerToGo + 1;

            let newPassagerUid = data.key
            self.passagerToGoArrayId.push(data.key);

            if (firebase.auth().currentUser.uid == newPassagerUid) {
                self.showLoading(self.passagerToGo);
            }

            if ((self.passagerToGo == 4 || self.rides.length == self.passagerToGo) && firebase.auth().currentUser.uid == newPassagerUid) {
                console.log("self.readyTogo called")
                // Start api and create history
                self.readyTogo();
                self.createRecord(self.rides);

                // Remove the course from the rideRequest and currentRideShare table
                firebase.database().ref('rideRequest/' + self.rideId).remove()
                firebase.database().ref('currentRideShare/' + self.rideId).remove()

                //TODO pay course

                // TODO Uncomment We delete the previous notification
                for (let i = 0; i < self.passagerToGoArrayId.length; i++) {
                    firebase.database().ref('notificationShareRide/' + self.passagerToGoArrayId[i] + '/' + self.rideId).remove();
                    firebase.database().ref('Users/' + self.passagerToGoArrayId[i] + "/currentCourse").set(false);
                }
            }
        });
    }


    // Call the api to order a cab
    readyTogo() {
        this.usagersJson = [];
        this.jsonString = "";
        let rides = this.rides;
        for (let i = 0; i < rides.length; i++) {
            let currentRideObject = rides[i];
            /*
            adresseDepart:
             adresseDestination:
             clientId:
             rideId:
            */

            let adresseDepart = currentRideObject.adresseDepart;
            let adresseDestination = currentRideObject.adresseDestination;
            let indexAdresseDepart = this.rideOrder.indexOf(currentRideObject.adresseDepart);
            let indexAdresseDestination = this.rideOrder.indexOf(currentRideObject.adresseDestination);
            let clientId = currentRideObject.clientId
            console.log(i + " Json Fraxion client " + clientId)

            // We format the json of each client in the ride
            this.formatJsonClient(clientId, adresseDepart, adresseDestination, indexAdresseDepart, indexAdresseDestination, this.callBackCreateCourse, i, this.rides.length);
        }

        let courseJson = new Course(new Date(), this.usagersJson);
        let usagersRealJson = {};
        usagersRealJson['usagers'] = [];
        console.log('length ' + this.usagersJson.length)

        for (let i = 0; i < this.usagersJson.length; i++) {
            console.log('ici i' + i)
            usagersRealJson['usagers'].push(this.usagersJson[i]);
        }
    }




    getVehiculeProximite(lat, long) {
        let url = 'https://stripepool.herokuapp.com/getVehiculeProximite'
        let body = { latitude: lat, longitude: long }
        $.ajax({
            url: url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            },
            type: 'POST',
            data: body,
            success: function(data) {
                //Reponse du serveur
                console.log(data)
            },
            error: function(data) {
                console.log(data)
            }
        });
    }


    createCourseAPIFraxion(course) {
        let url = 'https://stripepool.herokuapp.com/createCourse'
        let body = { courseJson: course }
        let self = this;
        console.log("createCourseAPIFraxion")
        console.log(body)
        $.ajax({
            url: url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            },
            type: 'POST',
            data: body,
            success: function(data) {
                console.log("Success from create course")
                console.log(data)
                console.log("Course created Id : " + data.body.id)
                let idCourseCreated = data.body.id;
                self.getCourseAPIFraxion(idCourseCreated, self);
            },
            error: function(data) {
                console.log("Error from create course")
                console.log(data)
            }
        });
    }


    // Callback called each time we encode a client adress with geocoder
    callBackCreateCourse(aStr, index, numberOfRides, self) {
        if (index + 1 == numberOfRides) {
            console.log('*******Calling the fraxion api *******')
            aStr = { usagers: aStr }
            console.log(aStr)
            //We make a request to the api in order to create  a real course
            self.createCourseAPIFraxion(aStr);
        }
    }


    // Create the Json format of the request to send
    formatJsonClient(clientId, adresseDepart, adresseDestination, ordreArretDepart, ordreArretDestination, callback, index, numberOfRides) {
        let geocoder = new google.maps.Geocoder();
        let self = this;
        geocoder.geocode({ "address": adresseDepart }, function(results, status) {
            //create geo object from resluts
            let lat = results[0].geometry.location.lat();
            let long = results[0].geometry.location.lng();
            let maj = "mise a jour";
            let geoObj = new Geo(long, lat, maj);

            //create address object from resluts
            let civique = results[0].address_components[0].long_name;
            let adresse = results[0].address_components[1].long_name;
            let ville = results[0].address_components[3].long_name;
            let region = results[0].address_components[5].long_name;
            let formatted_address = results[0].formatted_address;
            let adresseObj = new Adresse(civique, adresse, ville, region, formatted_address);
            //create location object from geoObj and adresseObj
            let originLocationObj = new Location(geoObj, adresseObj, ordreArretDepart);
            geocoder.geocode({ "address": adresseDestination }, function(results, status) {
                //create geo object from resluts
                let lat = results[0].geometry.location.lat();
                let long = results[0].geometry.location.lng();
                let maj = "mise a jour";
                let geoObj = new Geo(long, lat, maj);

                //create address object from resluts
                let civique = results[0].address_components[0].long_name;
                let adresse = results[0].address_components[1].long_name;
                let ville = results[0].address_components[3].long_name;
                let region = results[0].address_components[5].long_name;
                let formatted_address = results[0].formatted_address;
                let adresseObj = new Adresse(civique, adresse, ville, region, formatted_address);
                //create location object from geoObj and adresseObj
                let destinationLocationObj = new Location(geoObj, adresseObj, ordreArretDestination);
                let usager = new Usager(originLocationObj, destinationLocationObj, clientId, "", "remarque", "tel")
                //console.log(usager)
                self.usagersJson.push(usager);
                self.jsonString = self.usagersJson;
                callback(self.jsonString, index, numberOfRides, self);
            });
        });
    }

    createRecord(rides) {
        for (let i = 0; i < rides.length; i++) {
            var postData = {
                adresseDepart: rides[i].adresseDepart,
                adresseDestination: rides[i].adresseDestination,
                rideOrder: this.rideOrder,
                rideId: this.rideId
            }
            var updates = {};
            updates['/Records/' + rides[i].clientId + "/" + this.rideId] = postData;
            firebase.database().ref('Users/' + rides[i].clientId + "/currentCourse").set(false);
            firebase.database().ref().update(updates);
            //let newNotificationKey = firebase.database().ref().child('/History/'+rides[i].clientId+this.rideId).push().key
        }
    }

    //Flow  formatJsonClient() -> callBackCreateCourse() <- [Call the fraxion api] -> ReadyToGo()

    getCourseAPIFraxion(courseId, self) {
        let url = 'https://stripepool.herokuapp.com/getCourse'
        let body = { courseId: courseId }
        $.ajax({
            url: url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
            },
            type: 'POST',
            data: body,
            success: function(data) {
                //Reponse du serveur
                /*
                        "chauffeur_id": -1,
                        "id": 3344,
                        "status": "Termine",
                        "vehicule": "",
                        "vehicule_geo": null,
                        "vehicule_id": 0
                */
                console.log("getCourseAPIFraxion")
                console.log(data.body)
                let jsonResponse = JSON.parse(data.body)
                // CurrentPos doit être notre position courante
                // let currentPos = { lat: 45.500601, lng: -73.614254 };//poly
                let currentPos = self.latlngStartClient
                console.log(currentPos)
                let currentPosMarker = new google.maps.Marker({
                    position: currentPos,
                    map: self.map,
                    draggable: false,
                    title: 'Your currentPos'
                });

                // Fixed at cote des neiges, should be the response of the api
                let vehicule_assigne_geo = { lat: 45.495252, lng: -73.605798 };
                //let vehicule_assigne_geo = { lat: 45.451057, lng: -73.736736 }; coop-Taxi
                firebase.database().ref('currentRideShare/' + self.rideId + '/vehiculeAssigned').set({ latlng: vehicule_assigne_geo.lat + "_" + vehicule_assigne_geo.lng });
            },
            error: function(data) {
                console.log(data)
            }
        });

    }


    showTaxiAssigned(currentPos, vehicule_assigne_geo, self) {
        var image = "img/Sedan-52.png";
        let marker = new google.maps.Marker({
            position: vehicule_assigne_geo,
            map: self.map,
            draggable: false,
            icon: image,
            title: 'Your taxi'
        });
        self.calcRouteBetween(currentPos, vehicule_assigne_geo, marker);
        marker.setVisible(false);
    }

    showAlertOrderedTaxi(duration, distance) {
        let self = this;
        self.alert = self.alertCtrl.create({
            title: "Taxi en cours de cours de route",
            subTitle: "Votre taxi est à " + distance + " de votre position. Il sera à votre disposition dans approximativement " + duration,
            buttons: ["OK"]
        });

        self.alert.present();
    }
    calcRouteBetween(currentPos, randomTaxi, marker) {
        console.log("currentPos")
        console.log(currentPos)
        this.directionsDisplay.setMap(this.map);
        var request = {
            origin: randomTaxi,
            destination: currentPos,
            travelMode: 'DRIVING'
        };

        let self = this;
        this.directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                let routes = result.routes;
                let distance = routes[0].legs[0].distance.text;
                let duration = routes[0].legs[0].duration.text;
                self.showAlertOrderedTaxi(duration, distance)
                let steps = routes[0].legs[0].steps;
                for (var c = 0; c < steps.length; c++) {
                    for (var i = 0; i < steps[c].lat_lngs.length; i++) {
                        var LatLng = { lat: steps[c].lat_lngs[i].lat(), lng: steps[c].lat_lngs[i].lng() };
                        var image = "img/Sedan-52.png";
                        let curMarker = new google.maps.Marker({
                            position: LatLng,
                            map: self.map,
                            draggable: false,
                            icon: image,
                            visible: false,
                            title: 'Your taxi'

                        });
                        self.tabmarkers.push(curMarker);
                    }
                }
                self.move(self.tabmarkers)
            } else {
                console.log("Error: calcRouteBetween()")
            }
        });
    }


    move(markers) {
        var delay = 500;
        this.displayMarker(markers, 0, delay);
    }

    displayMarker(markers, index, delay) {
        let self = this;
        if (index > 0)
            markers[index - 1].setVisible(false);
        else {
            markers[markers.length - 1].setVisible(false);
        }

        markers[index].setVisible(true);
        if (index < markers.length - 1) {
            setTimeout(function() {
                self.displayMarker(markers, index + 1, delay);
            }, delay);
        }
    }

    // Charge the client the input amount
    chargeClient(amount) {
        let url = 'https://stripepool.herokuapp.com/charge'
        firebase.database().ref('/paiementInfo/' + firebase.auth().currentUser.uid).once('value', function(data) {
            let stripeCustomerId = data.val().clientStripeId
            let body = {
                customerId: stripeCustomerId,
                amount: amount
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

    // Return the latlng param of the current user in the current ride
    getOurLatLongAddresses(rideArray) {
        let adresseLatLng = { latlngStart: 'Blabla', latlngEnd: 'Blabla' }
        for (let i = 0; i < rideArray.length; i++) {
            console.log("i = " + i)
            console.log(rideArray[i])
            if (rideArray[i].clientId == firebase.auth().currentUser.uid) {
                let latlngStart = rideArray[i].latlngStart
                let latlngEnd = rideArray[i].latlngEnd
                adresseLatLng = { latlngStart: latlngStart, latlngEnd: latlngEnd };
            }
        }
        return adresseLatLng;
    }


    // Return the latlng param of the current user in the current ride
    getOurAddresses(rideArray) {
        let adresses = { adresseStart: 'Blabla', adresseEnd: 'Blabla' }
        for (let i = 0; i < rideArray.length; i++) {
            if (rideArray[i].clientId == firebase.auth().currentUser.uid) {
                let adresseStart = rideArray[i].adresseDepart
                let adresseEnd = rideArray[i].adresseDestination
                adresses = { adresseStart: adresseStart, adresseEnd: adresseEnd };
            }
        }
        return adresses;
    }

    listenToVehiculeAssigned() {
        let self = this
        console.log("listenToVehiculeAssigned")
        firebase.database().ref('currentRideShare/' + this.rideId + '/vehiculeAssigned').on('child_added', function(data) {
            if (self.loading) {
                self.loading.dismiss();
            }
            let lat_longString = data.val();
            console.log("lat_longString")
            console.log(lat_longString)
            let lat = parseFloat(lat_longString.split("_")[0])
            let lng = parseFloat(lat_longString.split("_")[1])
            let vehicule_assigne_geo = { lat: lat, lng: lng }
            console.log("vehicule_assigne_geo")
            console.log(vehicule_assigne_geo)
            let currentPos = self.latlngStartClient
            console.log("currentPos in listenToVehiculeAssigned")
            console.log(currentPos);
            self.showTaxiAssigned(currentPos, vehicule_assigne_geo, self)
        });
    }

    // Update the map instantaneously as user arrive
    listenToNewClientJoin() {
        let self = this;
        console.log("Self Rides Before")
        console.log(self.rides)
        firebase.database().ref('notificationShareRide/' + firebase.auth().currentUser.uid + '/' + this.rideId + '/rides').on('child_added', function(data) {
            if (data.val()) {
                // Add if the ride doesn't exist yet
                if (!self.containsObject(data.val(), self.rides)) {
                    self.rides.push(data.val())
                }
            }
            console.log("Self Rides")
            console.log(self.rides)
            self.passagerActuel = self.rides.length;
            // Update rideOrder as well
            firebase.database().ref('notificationShareRide/' + firebase.auth().currentUser.uid + '/' + self.rideId).once('value', function(data) {
                self.rideOrder = data.val().rideOrder;
                console.log("RideOrder updated")
                console.log(self.rideOrder)
                let resultRequest = self.buildRouteRequest(self.rideOrder);
                self.drawSharedRoute(resultRequest.adresseStart, resultRequest.adresseEnd, resultRequest.waypoints, self);
            });
        });
    }


    // Verify if an object is already in the rides array
    containsObject(obj, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if ((list[i].clientId === obj.clientId) && (list[i].rideId === obj.rideId)) {
                return true;
            }
        }
        return false;
    }

    /////////////// Ride-Share-View
    mergeRides(rides, rideOrder, notifId) {
        this.saveShareRideRequest(rides, rideOrder, notifId)
    }

    // Firebase save a shareRequest on the save request table
    saveShareRideRequest(rides, rideOrder, notifId) {
        var postData = {
            rides: rides,
            rideOrder: rideOrder,
            notifId: notifId
        };

        // Note: We should not create a new key for the merged ride but instead use the notif id to create a new ride
        // Write the new post's data simultaneously in the posts list and the user's post list.
        var updates = {};
        updates['/rideRequest/' + notifId] = postData;
        return firebase.database().ref().update(updates);
    }


    // Refuser clicked
    refuser() {
        console.log("Refuser clicked");
        console.log()
        for (let i = 0; i < this.rides.length; i++) {
            firebase.database().ref('notificationShareRide/' + this.rides[i].clientId + '/' + this.rideId).remove();
            firebase.database().ref('Users/' + this.rides[i].clientId + "/currentCourse").set(false);
        }
    }

    // TODO(Logic to cancel ride)
    cancelRide() {
        console.log("Cancel clicked")
        this.removeRide();
        this.nav.popToRoot();
    }

    removeRide() {
        let self = this
        let currentUid = firebase.auth().currentUser.uid;

        // Remove ourself from the passagerToGoArrayId
        if (this.passagerToGoArrayId.indexOf(currentUid) != -1) {
            this.passagerToGoArrayId.splice(this.passagerToGoArrayId.indexOf(currentUid), 1)
        }

        let newRideOrder = this.rideOrder;
        let newRides = this.rides;

        let indexAdrStart = newRideOrder.indexOf(this.adresseStartClient)
        let indexAdrEnd = newRideOrder.indexOf(this.adresseEndClient)

        if (indexAdrStart != -1) {
            newRideOrder.splice(indexAdrStart, 1);
        }
        if (indexAdrEnd != -1) {
            newRideOrder.splice(indexAdrEnd, 1);
        }

        // Update  ride
        for (let i = 0; i < newRides.length; i++) {
            if (newRides[i].clientId == currentUid) {
                newRides.splice(i, 1);
            }
        }

        // Delete ourself from notifications and currentRideShare
        firebase.database().ref('notificationShareRide/' + currentUid + '/' + this.rideId).remove();
        firebase.database().ref('currentRideShare/' + this.rideId + '/passagerToGo/' + currentUid).remove();

        // updates rides and rideOrder dans notificationShareRide
        for (let i = 0; i < self.passagerToGoArrayId.length; i++) {
            let notifRideOrderUpdate = {}
            let notifRideUpdate = {}
            notifRideOrderUpdate['notificationShareRide/' + self.passagerToGoArrayId[i] + '/' + self.rideId + '/rideOrder'] = newRideOrder;
            notifRideUpdate['notificationShareRide/' + self.passagerToGoArrayId[i] + '/' + self.rideId + '/rides'] = newRides;
            firebase.database().ref().update(notifRideOrderUpdate);
            firebase.database().ref().update(notifRideUpdate);

        }

        // Update currentRideShare
        let curRideOrderUpdate = {}
        let curRideUpdate = {}
        curRideOrderUpdate['currentRideShare/' + self.rideId + '/rideOrder'] = newRideOrder;
        curRideUpdate['currentRideShare/' + self.rideId + '/rides'] = newRides;
        firebase.database().ref().update(curRideOrderUpdate);
        firebase.database().ref().update(curRideUpdate);

        // Update  rideRequest
        let reqRideOrderUpdate = {}
        let reqRideUpdate = {}
        reqRideOrderUpdate['rideRequest/' + self.rideId + '/rideOrder'] = newRideOrder;
        reqRideUpdate['rideRequest/' + self.rideId + '/rides'] = newRides;
        firebase.database().ref().update(reqRideOrderUpdate);
        firebase.database().ref().update(reqRideUpdate);

    }

    listenToUserCancelation() {
        let self = this;
        console.log("Self Rides Before")
        console.log(self.rides)
        firebase.database().ref('notificationShareRide/' + firebase.auth().currentUser.uid + '/' + this.rideId + '/rides').on('child_removed', function(data) {
            if (data.val()) {
                // Remove our ride
                for (let i = 0; i < self.rides.length; i++) {
                    if ((self.rides[i].clientId === data.val().clientId) && (self.rides[i].rideId === data.val().rideId)) {
                        self.rides.splice(i, 1);
                    }
                }
            }
            console.log("Self Rides")
            console.log(self.rides)
            self.passagerActuel = self.rides.length;

            // Update rideOrder as well
            firebase.database().ref('notificationShareRide/' + firebase.auth().currentUser.uid + '/' + self.rideId).once('value', function(data) {
                if (data.val()) {
                    self.rideOrder = data.val().rideOrder;
                    console.log("RideOrder updated")
                    console.log(self.rideOrder)
                    let resultRequest = self.buildRouteRequest(self.rideOrder);
                    self.drawSharedRoute(resultRequest.adresseStart, resultRequest.adresseEnd, resultRequest.waypoints, self);
                }
            });
        });
    }

    // This function compute the shareRide of the user
    // bestRoute = rideOrder
    // adresses ?
    // arrayStart ? arrayEnd
    priceCalculation(bestRoute,adresses,arrayStart, arrayEnd) {
        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
            {
                origins: adresses,
                destinations: adresses,
                travelMode: 'DRIVING',
            }, callback);
        let self = this;
        function callback(response, status) {
            if (status == 'OK') {
                var origins = response.originAddresses;
                var destinations = response.destinationAddresses;
                let matrix = [];
                for (let i = 0; i < origins.length; i++) {
                    matrix[i] = [];
                    for (let j = 0; j < origins.length; j++) {
                        matrix[i][j] = undefined;
                    }
                }
                for (let i = 0; i < origins.length; i++) {
                    var results = response.rows[i].elements;
                    for (let j = 0; j < results.length; j++) {
                        var element = results[j];
                        var distance = element.distance.value;
                        var duration = element.duration.text;
                        var from = origins[i];
                        var to = destinations[j];
                        matrix[i][j] = distance / 1000.0;
                    }
                }

                // we have the matrix of distance here let's cal the stats

                //currentUser distance
                let myDistance = this.calculateMyDistanceInTheShareRide(bestRoute, matrix, adresses);
                let sumDistance = this.calculateSumDistanceInTheShareRide(bestRoute, matrix, adresses, arrayStart, arrayEnd);

                let distanceBestRoute = 0;
                // Use a for loop to have the distance of rideOrder

                let sharedPrice = this.calculateSharedPrice(myDistance, sumDistance, distanceBestRoute);

                // Calcul du share ride price
                this.sharedRidePrice = sharedPrice;
                this.sharedRideDistance = Math.round(myDistance * 100) / 100;
            }
        }
    }

    // This function calculate my distance in the route
    calculateMyDistanceInTheShareRide(bestRoute, matrix, adresses) {
        let indexStart = bestRoute.indexOf(this.adresseStartClient);
        let indexEnd = bestRoute.indexOf(this.adresseEndClient);
        let distance = 0;
        for (let i = indexStart; i < indexEnd; i++) {
            let first = bestRoute[i];
            let second = bestRoute[i + 1];
            let indexFirst = adresses.indexOf(first);
            let indexSecond = adresses.indexOf(second);
            distance += matrix[indexFirst][indexSecond];
        }
        console.log("My distance in the share ride " + distance)
        return distance;
    }


    calculateSumDistanceInTheShareRide(bestRoute, matrix, adresses, arrayStart, arrayEnd) {
        let numberOfClients = arrayStart.length;
        let distance = 0;
        for (let i = 0; i < numberOfClients; i++) {
            let adresseStarti = arrayStart[i];
            let adresseEndi = arrayEnd[i];
            let indexStart = bestRoute.indexOf(adresseStarti);
            let indexEnd = bestRoute.indexOf(adresseEndi);
            for (let i = indexStart; i < indexEnd; i++) {
                let first = bestRoute[i];
                let second = bestRoute[i + 1];
                let indexFirst = adresses.indexOf(first);
                let indexSecond = adresses.indexOf(second);
                distance += matrix[indexFirst][indexSecond];
            }
        }
        return distance;
    }

    calculateSharedPrice(myDistance, sumDistance, distanceBestRoute) {
        // Nombre de kilomètres X 1,7 + 20% plus 1$
        let nbKmBestRoute = distanceBestRoute;
        let priceBestRoute = (nbKmBestRoute * 1.7) + 0.2 * (nbKmBestRoute * 1.7) + 1;
        let sharedPrice = (myDistance / sumDistance) * priceBestRoute;
        return Math.round(sharedPrice * 100) / 100;
    }
}
