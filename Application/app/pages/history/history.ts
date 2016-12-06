/**
 * @summary Cette classe représente la page de l'histtorique des courses effectuees par l'utilisateur dans l'application Taxi Partage.
 *
 * @author Equipe Whos.
 */
 
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TripService } from '../../services/trip-service';
import {RecordViewPage} from '../record-view/record-view';

declare var firebase: any;


@Component({
    templateUrl: 'build/pages/history/history.html',
})
export class HistoryPage {
    // history records
    private records: any;
    private recordsData: any;

    constructor(private nav: NavController, private tripService: TripService) {
        //this.records = tripService.getAll();
        this.recordsData = [];
        this.records =[];
        this.records = tripService.getAll();
        this.loadRecord()
    }

    recordClicked(record) {
        let index = this.records.indexOf(record);
        this.nav.push(RecordViewPage, { rideToDraw: this.records[index].rideOrder });
    }
    loadRecord() {
        let _this = this;
        let currentUserId = firebase.auth().currentUser.uid;
        firebase.database().ref('Records/' + currentUserId).on('child_added', function(data) {
            let record = data.val(); // ici
            record.id = data.key;

            let splittedAdressStart = record.adresseDepart.split(',')[0]
            let splittedAdressEnd = record.adresseDestination.split(',')[0]
            _this.recordsData.push(record);
            let rideOrder = record.rideOrder;
            _this.records.push(_this.buildRecord(splittedAdressStart, splittedAdressEnd, rideOrder));
        });
    }


    buildRecord(adresseDepart, adresseDestination, rideOrder) {
        let record = {
            time: "2016",
            from: adresseDepart,
            to: adresseDestination,
            rideOrder: rideOrder

        }

        return record;
    }
}
