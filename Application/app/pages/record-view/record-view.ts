/**
 * @summary Cette classe renferme la vue d'une historique
 *
 * @author Equipe Whos.
 */

import { Component, ViewChild, Injectable } from '@angular/core';
import { NavController, NavParams, Platform, AlertController, Slides } from 'ionic-angular';
import { Http, Response, Headers, RequestOptions, RequestMethod, Request, URLSearchParams } from '@angular/http';
declare var google: any;
declare var $: any;
declare var firebase: any;
@Injectable()


@Component({
    templateUrl: 'build/pages/record-view/record-view.html',
})
export class RecordViewPage {

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

    private sharedMaps: any[];
    private shareRidesData: any[];

    // map height
    private mapHeight: number = 480;

    private rideOrder: any;



    constructor(private nav: NavController, private platform: Platform, private navParams: NavParams, private http: Http) {

        // when platform ready, init map

        this.mapSlide = "mapSlide_1";
        this.rideOrder = navParams.get('rideToDraw');
        let rideToDraw = navParams.get('rideToDraw');
        platform.ready().then(() => {
            //console.log('ready');
            // init map
            let waypoints = [
                {
                    location: "4875 Avenue Dufferin, Montréal, QC H3X 2Z2, Canada",
                    stopover: false
                },
                {
                    location: "555 Rue Lucien-Paiement, Laval, QC H7N 0A5, Canada",
                    stopover: false
                }];

            let resultRequest = this.buildRecordRoute(rideToDraw);
            this.initializeMap("mapSlideRecord", resultRequest.adresseStart, resultRequest.adresseEnd, resultRequest.waypoints);
            //  console.log("Inside platform.ready()");
            //console.log(this.mapSlide);
        });
        this.shareRidesData = [];
    }


    initializeMap(idMap, origin, destination, waypoints) {
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
        this.drawRecordRoute(origin, destination, waypoints);
    }


    // Map route configuration
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    // Itenary_object : origin, destination, String[] waypoints
    drawRecordRoute(origin, destination, waypoints) {
        console.log('inside draw record');
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
                console.log(result);
                console.log(distance);
                console.log(duration);
            } else {
                console.log("Error: drawSharedRoute()")
            }
        });
    }

    addToWayPoints(adresseStartClient, adresseEndClient, waypoints) {
        let newWayPoints = waypoints;
        newWayPoints.push({ location: adresseStartClient, stopover: false });
        newWayPoints.push({ location: adresseEndClient, stopover: false });
        return newWayPoints;
    }

    buildRecordRoute(routeStep) {
        let adresseStart = routeStep[0];
        let adresseEnd = routeStep[routeStep.length - 1];
        let waypoints = [];
        for (let i = 1; i < routeStep.length - 1; i++) {
            waypoints.push({ location: routeStep[i] });
        }
        return { adresseStart: adresseStart, adresseEnd: adresseEnd, waypoints: waypoints }
    }
}
