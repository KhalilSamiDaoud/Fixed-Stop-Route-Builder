import * as Station from './station.js';
import * as RST from './rst.js';
import * as Preloader from '../preloader.js';

async function loadAllTestData() {
    await loadTestStations();
    await loadTestRSTs();
}

async function loadTestStations() {
    return new Promise((resolve, reject) => {
        fetch('../data/new_Station.json')
            .then(response => {
                return response.json();
            })
            .then( data => {
                Station.initStations(data.stations);
                Preloader.setProgress(50);
                resolve();
            })
            .catch( error => {
                console.warn('Error when loading station data');
                console.error(error);
                reject();
            })
    });
}

async function loadTestRSTs() {
    return new Promise((resolve, reject) => {
        fetch('../data/new_RST.json')
            .then( response => {
                return response.json();
            })
            .then( data => {
                RST.initRSTs(data.rsts);
                Preloader.setProgress(75);
                resolve();
            })
            .catch( error => {
                console.warn('Error when loading RST data');
                console.error(error);
                reject();
            })
        });
}

export { loadAllTestData };