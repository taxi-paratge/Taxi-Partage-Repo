/**
 * @summary Cette classe gère la logique du vue partage
 *
 * @author Equipe Whos.
 */

import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Platform, AlertController, Slides } from 'ionic-angular';
import {RideShareWaitPage} from "../ride-share-wait/ride-share-wait";


declare var google: any;
declare var firebase: any;


/*
  Generated class for the RideShareRequestPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
    templateUrl: 'build/pages/ride-share-view/ride-share-view.html',
})
export class RideShareViewPage {


    //Slider
    @ViewChild('mapSlider') slider: Slides;

    // Map
    private map: any;

    // Map div Id
    private mapSlide: string;
    private lat1: any;
    private long1: any;
    private lat2: any;
    private long2: any;

    //client AdresseDep et adresseEnd
    private adresseStartClient: string;
    private adresseEndClient: string;
    private latlngStartClient: any;
    private latlngEndClient: any;

    private sharedMaps: any[];
    private shareRidesData: any[];
    // map height
    private mapHeight: number = 480;

    private rideOrder: any
    private rides: any
    private id: any
    private loading: any;
    constructor(private nav: NavController, private platform: Platform, private navParams: NavParams) {

        // when platform ready, init map
        //this.loading = app.getComponent('loading');
        this.mapSlide = "mapSlide_11";
        this.rideOrder = navParams.get('rideToShare').rideOrder;
        this.rides = navParams.get('rideToShare').rides;
        this.id = navParams.get('rideToShare').id;
        this.latlngStartClient = this.getOurLatLongAddresses(this.rides).latlngStart;
        this.latlngEndClient = this.getOurLatLongAddresses(this.rides).latlngEnd;

        platform.ready().then(() => {
            let resultRequest = this.buildRouteRequest(this.rideOrder);
            this.initializeMap("mapSlide_11", resultRequest.adresseStart, resultRequest.adresseEnd, resultRequest.waypoints);
        });
        this.shareRidesData = [];
    }


    initializeMap(idMap, origin, destination, waypoints) {
        let latLng = new google.maps.LatLng(45.491883, -73.691178);
        let mapOptions = {
            center: latLng,
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            zoomControl: false,
            draggable: false,
            streetViewControl: false
        }

        this.map = new google.maps.Map(document.getElementById(idMap), mapOptions);

        let options = { timeout: 120000, enableHighAccuracy: true };

        // refresh map
        setTimeout(() => {
            google.maps.event.trigger(this.map, 'resize');
        }, 300);

        this.drawSharedRoute(origin, destination, waypoints);
    }


    // Map route configuration
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    // Itenary_object : origin, destination, String[] waypoints
    drawSharedRoute(origin, destination, waypoints) {
        this.directionsDisplay.setMap(this.map);
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
        let self = this;
        this.directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                let routes = result.routes;
                let distance = routes[0].legs[0].distance.text;
                let duration = routes[0].legs[0].duration.text;
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


    accepter() {
        console.log(this.buildRouteRequest(this.rideOrder));
        this.mergeRides(this.rides, this.rideOrder, this.id);
        this.deleteOldRides(this.rides);

        let rideToShare = { rideOrder: this.rideOrder, rides: this.rides, id: this.id };
        // Navigate to RideShareWaitPage
        this.nav.push(RideShareWaitPage, { rideToShare: rideToShare, userLocation: { latlngStartClient: this.latlngStartClient, latlngEndClient: this.latlngEndClient } });
    }


    deleteOldRides(rides) {
        for (let i = 0; i < rides.length; i++) {
            let rideId = rides[i].rideId;
            firebase.database().ref('rideRequest/' + rideId).remove();
        }
    }


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
        // Get a key for a new Post.
        var newPostKey = firebase.database().ref().child('rideRequest').push().key;

        // Write the new post's data simultaneously in the posts list and the user's post list.
        var updates = {};
        updates['/rideRequest/' + newPostKey] = postData;
        return firebase.database().ref().update(updates);
    }

    // Refuser clicked
    refuser() {
        console.log("Refuser clicked");
        console.log()
        for (let i = 0; i < this.rides.length; i++) {
            firebase.database().ref('notificationShareRide/' + this.rides[i].clientId + '/' + this.id).remove();
            firebase.database().ref('Users/' + this.rides[i].clientId + "/currentCourse").set(false);
        }
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
}
