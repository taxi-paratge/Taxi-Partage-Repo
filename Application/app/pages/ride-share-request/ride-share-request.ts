/**
 * @summary Cette classe gère la logique initiale partage
 *
 * @author Equipe Whos.
 */

import { Component, ViewChild } from '@angular/core';
import { ToastController, ModalController, ViewController, NavController, NavParams, Platform, AlertController, Slides } from 'ionic-angular';
import { Course } from '../geo-coder/course';
import { Geo } from '../geo-coder/geo';
import { Adresse } from '../geo-coder/adresse';
import { Location } from '../geo-coder/location';
import { Usager } from '../geo-coder/usager';
import {RideShareViewPage} from "../ride-share-view/ride-share-view";
import {RideShareWaitPage} from "../ride-share-wait/ride-share-wait";
declare var google: any;
declare var firebase: any;


/*
Generated class for the RideShareRequestPage page.

See http://ionicframework.com/docs/v2/components/#navigation for more info on
Ionic pages and navigation.
*/
@Component({
    templateUrl: 'build/pages/ride-share-request/ride-share-request.html',
})
export class RideShareRequestPage {
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

    private alert: any;

    // User travel stats
    private singleTravelTime: any;
    private singleTravelDistance: any;
    private singleTravelPrice: any;

    private sharedTravelTime: any;
    private sharedTravelDistance: any;
    private sharedTravelPrice: any;

    private sharedRidePrice: any;
    private sharedRideDistance: any;

    private swipe: number;

    // Array of shared maps
    private sharedMaps: any[];
    private shareRidesData: any[];

    //bestRoute
    private bestRoute: any;

    private rideId: any;
    private notifId: any;
    private coursePartageable: any;

    constructor(private nav: NavController, private platform: Platform, private navParams: NavParams, private alertCtrl: AlertController, private toastCtrl: ToastController) {

        // when platform ready, init map

        this.coursePartageable = true;
        this.swipe = 0;
        this.notifId = null;
        this.mapSlide = "mapSlide";
        this.shareRidesData = [];
        this.ListenToShareRideAddition();

        this.adresseStartClient = navParams.get('adresseStart');
        this.adresseEndClient = navParams.get('adresseEnd');
        this.latlngStartClient = navParams.get('latlngStart');
        this.latlngEndClient = navParams.get('latlngEnd');
        this.rideId = navParams.get('rideId');

        this.getSingleTravelStats();
        this.sharedRidePrice = navParams.get('ridePrice');
        this.sharedRideDistance = navParams.get('rideDistance');
        platform.ready().then(() => {
            console.log('ready');
            // init map
            this.initializeMap("mapSlide", this.adresseStartClient, this.adresseEndClient, []);
        });

    }

    initializeMap(idMap, origin, destination, waypoints) {
        let latLng = new google.maps.LatLng(45.4510572, -73.73673610000003);

        let mapOptions = {
            center: latLng,
            zoom: 10,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            mapTypeControl: false,
            zoomControl: false,
            draggable: true,
            streetViewControl: false
        }

        this.map = new google.maps.Map(document.getElementById(idMap), mapOptions);
        let options = { timeout: 120000, enableHighAccuracy: true };

        // refresh map
        setTimeout(() => {
            google.maps.event.trigger(this.map, 'resize');
        }, 300);

        var image = 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png';
        var iconStart = { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 4 }
        var iconEnd = { path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW, scale: 4 }

        var startMaker = new google.maps.Marker({
            position: this.latlngStartClient,
            map: this.map,
            icon: iconStart
        });
        var endMaker = new google.maps.Marker({
            position: this.latlngEndClient,
            map: this.map,
            icon: iconEnd
        });

        // We center the Map at Udem, Should be modified to be the center of the shared routes
        this.map.setCenter({ lat: 45.50561560000001, lng: -73.6137592 });

        // Tracer de la route
        return this.drawSharedRoute(origin, destination, waypoints);
    }

    // Map route configuration
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsService = new google.maps.DirectionsService();

    // Draw ride sharing route

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
                let routes = result.routes;
                let distance = routes[0].legs[0].distance.text;
                let duration = routes[0].legs[0].duration.text;
                let waypointsOrder = routes[0].waypoint_order;
                let numberOfStops = waypointsOrder.length;
                // console.log("Waypoints order : " + waypointsOrder);
                // console.log("Waypoints: " + waypoints);
                let newOrigin = waypoints[0].location;
                let newWaypoints = waypoints.slice(1, 1 + waypoints.length - 2);
                let newDestination = waypoints[waypoints.length - 1].location;

                // console.log("Number of stops : " + numberOfStops);

                // Doing a new request with the new value;
                let newRequest = {
                    origin: newOrigin,
                    destination: newDestination,
                    travelMode: 'DRIVING',
                    waypoints: newWaypoints,
                    optimizeWaypoints: true
                };

                let newDirectionsService = new google.maps.DirectionsService();
                newDirectionsService.route(newRequest, function(result, status) {
                    if (status == 'OK') {
                        // Drawing the route
                        self.directionsDisplay.setDirections(result);
                    } else {
                        console.log("Error: drawSharedRoute()");
                    }
                });

                let permutationWaypoint = self.publicPermute(waypoints);
                self.getDistancePermute(permutationWaypoint);

                // For each route, display a summary information.
                let s = ""
                let route = routes[0];
                for (var i = 0; i < route.legs.length; i++) {
                    var routeSegment = i + 1;
                    s += 'Route Segment: ' + routeSegment + ' ';
                    s += route.legs[i].start_address + ' to ';
                    s += route.legs[i].end_address + ' ';
                    s += route.legs[i].distance.text + ' ';
                }
                self.sharedTravelTime = self.convertSecondToString(self.calculateNewDistanceAndDuration(result, self.adresseStartClient, self.adresseEndClient).duration);
                self.sharedTravelDistance = (self.calculateNewDistanceAndDuration(result, self.adresseStartClient, self.adresseEndClient).distance) / 1000;

                // Price calculation
                let nbKm = self.sharedTravelDistance;
            } else {
                console.log("Error: drawSharedRoute()")
            }
        });
    }


    // Take an array of waypoints, the start and end adresse of the user
    //  and return a new wayPoint array containing the user
    addToWayPoints(adresseStartClient, adresseEndClient, waypoints) {
        let newWayPoints = waypoints;
        newWayPoints.push({ location: adresseStartClient });
        newWayPoints.push({ location: adresseEndClient });
        return newWayPoints;
    }

    //Show the list of share rides
    listCoursePartage() {
        console.log(this.shareRidesData);
    }

    //Update the list of share rides
    ListenToShareRideAddition() {
        let self = this;
        firebase.database().ref('rideRequest/').on('child_added', function(data) {
            let ride = data.val(); // ici
            ride.id = data.key;
            self.shareRidesData.push(ride);
        });
    }

    // Return the client in the current ride
    getRideUser(currentShareRideData) {
        let userInvolved = []
        let rides = currentShareRideData.rides
        for (let i = 0; i < rides.length; i++) {
            userInvolved.push(rides[i].clientId)

        }
        return userInvolved
    }

    // build a request to send to the map direction API and
    buildAShareMapRequest(shareRideData) {
        // Takes waypoints and add the client start and end point
        let newWayPoints = shareRideData.waypoints;
        newWayPoints = this.addToWayPoints(this.adresseStartClient, this.adresseEndClient, newWayPoints);
        // Build the request and returns it
        let request = {
            origin: shareRideData.origin,
            destination: shareRideData.destination,
            travelMode: 'DRIVING',
            waypoints: newWayPoints,
            optimizeWaypoints: true
        };
        return request;
    }


    calculateNewDistanceAndDuration(response, adresseStartClient, adresseEndClient) {
        let route = response.routes[0];
        let indexStart = 0;
        let indexEnd = 0;
        for (let i = 0; i < route.legs.length; i++) {
            if (route.legs[i].start_address == adresseStartClient) {
                indexStart = i;
            }
            if (route.legs[i].start_address == adresseEndClient) {
                indexEnd = i;
            }
        }

        let start = indexStart < indexEnd ? indexStart : indexEnd;
        let end = indexStart < indexEnd ? indexEnd : indexStart;

        let duration = 0;
        let distance = 0;

        for (let i = start; i < end; i++) {
            distance += route.legs[i].distance.value; // en metre
            duration += route.legs[i].duration.value;// en seconde
        }
        return { distance: distance, duration: duration };
    }

    // Convert time to readable format
    convertSecondToString(second) {
        let hours = Math.floor(second / 3600);
        let minutes = Math.floor((second - hours * 3600) / 60);
        let seconds = second - (second * 3600 + minutes * 60);

        let hString = hours > 0 ? hours + 'h' : '';
        let mString = minutes > 0 ? minutes + 'mn' : '';
        let sString = seconds > 0 ? seconds + 's' : '';
        return hString + ' ' + mString + ' ' + sString;
    }

    // Give the user travel info for a unique ride
    getSingleTravelStats() {
        let directionsServiceSingle = new google.maps.DirectionsService();
        let self = this;
        let request = {
            origin: self.adresseStartClient,
            destination: self.adresseEndClient,
            travelMode: 'DRIVING',
            optimizeWaypoints: true
        };
        directionsServiceSingle.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
                self.singleTravelDistance = result.routes[0].legs[0].distance.text;
                self.singleTravelTime = result.routes[0].legs[0].duration.text;

                // Nombre de kilomètres X 1,7 + 20% plus 1$
                let nbKm = (result.routes[0].legs[0].distance.value) / 1000;

                self.singleTravelPrice = nbKm * 1.7;
                self.singleTravelPrice += 0.2 * self.singleTravelPrice + 1;
                self.singleTravelPrice = Math.round(self.singleTravelPrice * 100) / 100;

            } else {
                console.log("Error getSingleTravelStats: drawSharedRoute()")
            }
        });
    }

    //Method called when the slider page change
    onSlideChanged2() {
        let currentIndex = this.slider.getActiveIndex();
        // console.log("Begin onSlideChanged2 with swipe number :" + currentIndex)

        this.swipe = currentIndex;
        // console.log(this.shareRidesData[currentIndex]);
        let arrayStart = this.getArrayStartAndEnd(this.shareRidesData[currentIndex]).arrayStart
        //arrayStart.push("51 Dundas St W, Mississauga, ON L5B 1H7, Canada")
        let arrayEnd = this.getArrayStartAndEnd(this.shareRidesData[currentIndex]).arrayEnd
        //arrayEnd.push("319 Queen St W, Toronto, ON M5V 2A4, Canada")
        let permut = this.getAllRidePermut(this.shareRidesData[currentIndex])
        let filteredArray = this.filterPermutation(permut, arrayStart, arrayEnd);
        this.getMatrix(filteredArray, arrayStart, arrayEnd);
        // console.log("End onSlideChanged2 with swipe number :" + currentIndex)
    }



    partagerClicked() {
        //TODO recheck this.swipe
        let currentUserId = firebase.auth().currentUser.uid;
        let allUsers = this.getRideUser(this.shareRidesData[this.swipe]);
        // We add ourself to the user table
        allUsers.push(currentUserId);
        let allRidesObject = this.shareRidesData[this.swipe];
        this.shareRidesData[this.swipe].id
        this.notifId = this.shareRidesData[this.swipe].notifId;
        this.sendBestRouteToUser(allRidesObject, this.bestRoute, allUsers)
    }

    permArr = [];
    usedChars = [];
    permute(input) {
        var i, ch;
        for (i = 0; i < input.length; i++) {
            ch = input.splice(i, 1)[0];
            this.usedChars.push(ch);
            if (input.length == 0) {
                this.permArr.push(this.usedChars.slice());
            }
            this.permute(input);
            input.splice(i, 0, ch);
            this.usedChars.pop();
        }
        return this.permArr;
    }

    publicPermute(input) {
        this.permArr = [];
        this.usedChars = [];
        return this.permute(input);
    }

    distancePermute = [];
    getDistancePermute(input) {
        this.distancePermute = [];
        //let permutations = this.publicPermute(input);
        for (let i = 0; i < input.length; i++) {
            let waypoints = input[i];
            let adresseDep = waypoints[0].location;
            let adresseDest = waypoints[1].location;
            let allWaypoints = waypoints.slice(2, waypoints.length);
            this.getDistance(adresseDep, adresseDest, allWaypoints, i);
        }
    }

    getDistance(adresseDepart, adresseArrive, waypoints, i) {
        let directionsServicePermute = new google.maps.DirectionsService();
        let self = this;
        let request = {
            origin: adresseDepart,
            destination: adresseArrive,
            waypoints: waypoints,
            travelMode: 'DRIVING',
            optimizeWaypoints: true
        };
        directionsServicePermute.route(request, function(result, status) {
            if (status == 'OK') {
                let routes = result.routes;
                let distance = routes[0].legs[0].distance.text;
                let duration = routes[0].legs[0].duration.text;
                self.distancePermute[i] = distance;
                // console.log(self.distancePermute);
                //console.log(self.singleTravelTime);
            } else {
                console.log("Error: getDistance()")
            }
        });
    }


    getArrayStartAndEnd(objectFromFirebase) {
        let arrayStart = [this.adresseStartClient]
        let arrayEnd = [this.adresseEndClient]

        for (let j = 0; j < objectFromFirebase.rides.length; j++) {
            arrayEnd.push(objectFromFirebase.rides[j].adresseDestination)
            arrayStart.push(objectFromFirebase.rides[j].adresseDepart)
        }

        return { arrayStart: arrayStart, arrayEnd: arrayEnd }
    }

    getAllRidePermut(objectFromFirebase) {
        let allAdresses = [this.adresseStartClient, this.adresseEndClient];
        for (let i = 0; i < objectFromFirebase.rideOrder.length; i++) {
            allAdresses.push(objectFromFirebase.rideOrder[i]);
        }
        let allPermuts = this.publicPermute(allAdresses);
        return allPermuts
    }

    filterPermutation(permutationArray, arrayStart, arrayEnd) {
        let filteredArray = []
        for (let i = 0; i < permutationArray.length; i++) {
            let currentPerm = permutationArray[i];

            //check if the first element of the permutation is not a departure address
            if (arrayStart.indexOf(currentPerm[0]) == -1)
                continue
            //check if the last element of the permutation is not an arrival address
            if (arrayEnd.indexOf(currentPerm[currentPerm.length - 1]) == -1)
                continue

            // for each client, check if departure come before arrival
            let isBad = false;
            for (let i = 0; i < arrayStart.length; i++) {
                let indexStart = currentPerm.indexOf(arrayStart[i]);
                let indexEnd = currentPerm.indexOf(arrayEnd[i]);

                if (indexStart > indexEnd) {
                    isBad = true
                    break
                }
            }
            if (isBad)
                continue

            //check if ride intesect
            let intersect = true;
            for (let i = 0; i < arrayStart.length; i++) {
                let indexStart = currentPerm.indexOf(arrayStart[i]);
                let indexEnd = currentPerm.indexOf(arrayEnd[i]);

                if ((indexStart == 0 && indexEnd == 1) || (indexStart == currentPerm.legth - 2 && indexStart == currentPerm.legth - 1)) {
                    intersect = false;
                    break;
                }
            }

            if (intersect) {
                filteredArray.push(currentPerm);
            }
        }
        return filteredArray;
    }

    getMatrix(permutations, arrayStart, arrayEnd) {
        let adresses = [];
        /*
                  D1 D2 D3 D4 A1 A2 A3 A4
                D1
                D2
                D3
                D4
                A1
                A2
                A3
                A4
                */
        for (let i = 0; i < arrayStart.length; i++) {
            adresses.push(arrayStart[i]);
        }

        for (let i = 0; i < arrayEnd.length; i++) {
            adresses.push(arrayEnd[i]);
        }

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
                self.getDistancePermutation(matrix, permutations, arrayStart, arrayEnd);

            } else {
                console.log("Error in getMatrix")
            }
        }

    }

    getDistancePermutation(matrix, permutations, arrayStart, arrayEnd) {
        let adresses = [];
        for (let i = 0; i < arrayStart.length; i++) {
            adresses.push(arrayStart[i]);
        }

        for (let i = 0; i < arrayEnd.length; i++) {
            adresses.push(arrayEnd[i]);
        }
        let distancesPerm = [];
        for (let i = 0; i < permutations.length; i++) {
            let currentPerm = permutations[i];
            let distance = 0;
            for (let j = 0; j < currentPerm.length - 1; j++) {
                let first = currentPerm[j];
                let second = currentPerm[j + 1];
                let indexFirst = adresses.indexOf(first);
                let indexSecond = adresses.indexOf(second);
                //let mat1
                // TODO Problem
                distance += matrix[indexFirst][indexSecond];
            }
            distancesPerm.push(distance);
        }
        // We get the min index of the array
        let indexBestRoute = this.minIndex(distancesPerm);

        let bestRoute = permutations[indexBestRoute];
        this.bestRoute = bestRoute;

        //currentUser distance
        let myDistance = this.calculateMyDistanceInTheShareRide(bestRoute, matrix, adresses);
        let sumDistance = this.calculateSumDistanceInTheShareRide(bestRoute, matrix, adresses, arrayStart, arrayEnd);

        let distanceBestRoute = distancesPerm[indexBestRoute];
        let sharedPrice = this.calculateSharedPrice(myDistance, sumDistance, distanceBestRoute);

        // Calcul du share ride price
        this.sharedRidePrice = sharedPrice;
        this.sharedRideDistance = Math.round(myDistance * 100) / 100;

        if (this.sharedRidePrice >= this.singleTravelPrice) {
            console.log("Course non acceptable")
            //toast show when the ride is not shareable
            let toast = this.toastCtrl.create({
                message: 'Une course individuelle est plus profitable',
                duration: 1500,
                position: 'middle'
            });
            toast.present();
        }

        let bestRouteRequest = this.buildRouteRequest(bestRoute);
        this.drawBestRoute(bestRouteRequest.adresseStart, bestRouteRequest.adresseEnd, bestRouteRequest.waypoints)
    }


    // Return the min index of an array
    minIndex(array) {
        let minIndex = 0;
        let min = array[0]
        for (let i = 0; i < array.length; i++) {
            if (array[i] < min) {
                minIndex = i
                min = array[i]
            }
        }
        return minIndex;
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

    drawBestRoute(origin, destination, waypoints) {
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
                optimizeWaypoints: false
            };
        } else {
            request = {
                origin: origin,
                destination: destination,
                travelMode: 'DRIVING',
                optimizeWaypoints: false
            };
        }
        let self = this;
        this.directionsService.route(request, function(result, status) {
            if (status == 'OK') {
                self.directionsDisplay.setDirections(result);
            } else {
                console.log("Error: drawBestRoute()");
            }
        });
    }


    // This function update the rides in the shareRide request, in order to create the notificationShareRide
    // for the share
    sendBestRouteToUser(ridesObject, bestRoute, users) {
        // Adding our route
        let allRides = ridesObject.rides;
        let newRides = [];

        for (let i = 0; i < allRides.length; i++) {
            let ride = allRides[i]
            ride.rideId = ridesObject.id
            newRides.push(ride)
        }

        // We add ourself
        newRides.push({ adresseDepart: this.adresseStartClient, adresseDestination: this.adresseEndClient, clientId: firebase.auth().currentUser.uid, latlngStart: this.latlngStartClient, latlngEnd: this.latlngEndClient, rideId: this.rideId });
        var postData = {
            rides: newRides,
            rideOrder: bestRoute,
            clients: users,
        };
        var updates = {};
        let newNotificationKey;
        if (this.notifId != null) {
            newNotificationKey = this.notifId;
        }
        else {
            newNotificationKey = firebase.database().ref().child('/notificationShareRide/').push().key;
        }

        // Notify all clients about the share.
        var updates = {};

        for (let i = 0; i < users.length; i++) {
            updates['/notificationShareRide/' + users[i] + '/' + newNotificationKey] = postData;
        }

        firebase.database().ref().update(updates);


        let self = this;
        //firebase.database().ref().update(updates);
        let currentUserId = firebase.auth().currentUser.uid;
        firebase.database().ref('notificationShareRide/' + currentUserId + '/' + newNotificationKey).once('value', function(data) {
            let notif = {
                rideOrder: bestRoute,
                rides: newRides,
                id: newNotificationKey
            }
            self.nav.push(RideShareWaitPage, { rideToShare: notif });
        });
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
