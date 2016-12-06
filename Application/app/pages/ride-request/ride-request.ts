/**
 * @summary Cette classe gère la logique de la commande initiale
 *
 * @author Equipe Whos.
 */

import { Component, ViewChild } from '@angular/core';
import { ModalController, ViewController, NavController, NavParams, Platform, AlertController, Slides, LoadingController } from 'ionic-angular';
import { Http, Response, Headers, RequestOptions, RequestMethod, Request, URLSearchParams } from '@angular/http';
import { Course } from '../geo-coder/course';
import { Geo } from '../geo-coder/geo';
import { Adresse } from '../geo-coder/adresse';
import { Location } from '../geo-coder/location';
import { Usager } from '../geo-coder/usager';
declare var google: any;
declare var firebase: any;
declare var $: any;


/*
Generated class for the RideShareRequestPage page.

See http://ionicframework.com/docs/v2/components/#navigation for more info on
Ionic pages and navigation.
*/
@Component({
    templateUrl: 'build/pages/ride-request/ride-request.html',
})
export class RideRequestPage {
    //Slider
    @ViewChild('mapSlider') slider: Slides;
    private map: any;

    // Map div Id
    private mapSlide: string;
    // map height
    private mapHeight: number = 480;
    private startPlace: any;
    private destinationPlace: any;
    private startPlaceLatLng: any;
    private destinationPlaceLatLng: any;

    private jsonString: any;
    private usagersJson: any;
    private clientId: any;

    private travelTime: any;
    private travelDistance: any;
    private ridePrice: any;
    private tabmarkers: any;

    constructor(private nav: NavController, private platform: Platform, private navParams: NavParams, private http: Http, private loadingCtrl: LoadingController, private alertCtrl: AlertController) {

        this.travelDistance = 0;
        this.travelTime = 0;
        this.mapSlide = "mapSlide_1";
        this.startPlace = navParams.get('infoToPass').adresseStart;
        this.destinationPlace = navParams.get('infoToPass').adresseEnd;
        this.startPlaceLatLng = navParams.get('infoToPass').latlngStart;
        this.destinationPlaceLatLng = navParams.get('infoToPass').latlngEnd;
        this.getTravelStats();
        this.clientId = firebase.auth().currentUser.uid;

        this.tabmarkers = [];

        platform.ready().then(() => {
            this.initializeMap("mapSlide_1", this.startPlace, this.destinationPlace);
        });
    }

    initializeMap(idMap, origin, destination) {
        //let latLng = new google.maps.LatLng(45.4510572, -73.73673610000003);
        //center: latLng,
        console.log('inside initializeMap');
        let mapOptions = {
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            zoomControl: false,
            draggable: false,
            streetViewControl: false
        }
        console.log('inside after initializeMap');
        this.map = new google.maps.Map(document.getElementById(idMap), mapOptions);

        let options = { timeout: 120000, enableHighAccuracy: true };

        // refresh map
        setTimeout(() => {
            google.maps.event.trigger(this.map, 'resize');
        }, 300);

        // Tracer de la route
        this.drawRecordRoute(origin, destination);
    }


    // Map route configuration
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    // Itenary_object : origin, destination, String[] waypoints
    drawRecordRoute(origin, destination) {
        console.log('inside draw record');
        this.directionsDisplay.setMap(this.map);
        let userPosition = 0;
        let taxiPosition = 0;
        let request = {};

        request = {
            origin: origin,
            destination: destination,
            travelMode: 'DRIVING',
            optimizeWaypoints: true
        };
        let self = this;
        this.directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                let routes = result.routes;
                let distance = routes[0].legs[0].distance.text;
                let duration = routes[0].legs[0].duration.text;
                self.travelTime = duration;
                self.travelDistance = distance;
                console.log(result);
                console.log(distance);
                console.log(duration);
            } else {
                console.log("Error: drawSharedRoute()")
            }
        });
    }

    //Flow  formatJsonClient() -> callBackCreateCourse() <- [Call the fraxion api] -> ReadyToGo()

    // Create the Json format of the request to send
    formatJsonClient(clientId, adresseDepart, adresseDestination, callback) {
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
            let originLocationObj = new Location(geoObj, adresseObj, 1);
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
                let destinationLocationObj = new Location(geoObj, adresseObj, 2);
                let usager = new Usager(originLocationObj, destinationLocationObj, self.clientId, "", "Course individuelle", "tel")
                //console.log(usager)
                self.usagersJson.push(usager);
                self.jsonString = self.usagersJson;
                callback(self.jsonString, self);
            });
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
                self.getCourseAPIFraxion(idCourseCreated);
            },
            error: function(data) {
                console.log("Error from create course")
                console.log(data)
            }
        });
    }

    // Callback called each time we encode a client adress with geocoder
    callBackCreateCourse(aStr, self) {
        console.log('*******Calling the fraxion api *******')
        aStr = { usagers: aStr }
        console.log(aStr)
        //We make a request to the api in order to create  a real course
        self.createCourseAPIFraxion(aStr);
    }

    start() {
        this.readyTogo();
        this.createRecord();
    }

    // Call the api to order a cab
    readyTogo() {
        this.usagersJson = [];
        this.jsonString = "";
        // We format the json of each client in the ride
        this.formatJsonClient(this.clientId, this.startPlace, this.destinationPlace, this.callBackCreateCourse);
    }

    getCourseAPIFraxion(courseId) {
        let url = 'https://stripepool.herokuapp.com/getCourse'
        let body = { courseId: courseId }
        let self = this;
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
                let jsonResponse = JSON.parse(data.body)

                // Visualisation du véhicule
                let currentPos = self.startPlaceLatLng;
                let vehicule_assigne_geo = { lat: 45.495252, lng: -73.605798 };// cote des neiges
                var image = "img/Sedan-52.png";
                let userStartMarker = new google.maps.Marker({
                    position: currentPos,
                    map: self.map,
                    draggable: false,
                    title: 'Your position'
                });

                let markerTaxi = new google.maps.Marker({
                    position: vehicule_assigne_geo,
                    map: self.map,
                    draggable: false,
                    icon: image,
                    title: 'Your taxi'
                });

                self.routeBetweenUserAndTaxi(currentPos, vehicule_assigne_geo, markerTaxi);
                markerTaxi.setVisible(false);
                console.log(jsonResponse.id)
            },
            error: function(data) {
                console.log(data)
            }
        });
    }


    // Cette fonction calcule le prix, la durée et la distance entre les adresses du client
    getTravelStats() {
        let directionsServiceSingle = new google.maps.DirectionsService();
        let self = this;
        let request = {
            origin: self.startPlace,
            destination: self.destinationPlace,
            travelMode: 'DRIVING',
            optimizeWaypoints: true
        };
        directionsServiceSingle.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                self.travelDistance = result.routes[0].legs[0].distance.text;
                self.travelTime = result.routes[0].legs[0].duration.text;

                // Nombre de kilomètres X 1,7 + 20% plus 1$
                let nbKm = (result.routes[0].legs[0].distance.value) / 1000;

                self.ridePrice = nbKm * 1.7;
                self.ridePrice += 0.2 * self.ridePrice + 1;
                self.ridePrice = Math.round(self.ridePrice * 100) / 100;

                console.log("getTravelStats");
                console.log(self.travelDistance);
                console.log(self.travelTime);
            } else {
                console.log("Error getTravelStats: drawSharedRoute()")
            }
        });
    }


    routeBetweenUserAndTaxi(currentPos, randomTaxi, marker) {
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
                console.log("Error: routeBetweenUserAndTaxi()")
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

    showAlertOrderedTaxi(duration, distance) {
        let self = this;
        let alert = this.alertCtrl.create({
            title: "Informations sur le taxi assigné à votre course",
            subTitle: "Votre taxi est à " + distance + " de votre position . Il sera à votre disposition dans " + duration,
            buttons: ["Ok"]
        });

        alert.present();
    }

    createRecord() {
          let rideId = firebase.database().ref().child('Users/' + firebase.auth().currentUser.uid + "/").push().key;
            var postData = {
                adresseDepart:this.startPlace,
                adresseDestination: this.destinationPlace,
            }
            var updates = {};
            updates['/Records/' + firebase.auth().currentUser.uid+ "/" + rideId] = postData;
            firebase.database().ref('Users/' + firebase.auth().currentUser.uid + "/currentCourse").set(false);
            firebase.database().ref().update(updates);
    }
}
