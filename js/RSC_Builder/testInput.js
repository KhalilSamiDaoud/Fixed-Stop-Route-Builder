import * as Station from './station.js';
import * as RST from './rst.js';
import * as RSC from './rsc.js';
import * as Route from './route.js';
import * as Preloader from '../preloader.js';

async function loadAllTestData() {
    await loadTestStations();
    await loadTestRSTs();
    await loadTestRSCs();
    await loadTestRoutes();
}

async function loadTestStations() {
    return new Promise((resolve, reject) => {
        fetch('../data/new_Station.json')
            .then(response => {
                return response.json();
            })
            .then(data => {
                Station.initStations(data.stations);
                Preloader.setProgress(25);
                resolve();
            })
            .catch(error => {
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
                Preloader.setProgress(50);
                resolve();
            })
            .catch( error => {
                console.warn('Error when loading RST data');
                console.error(error);
                reject();
            })
        });
}

async function loadTestRSCs() {
    return new Promise((resolve, reject) => {
        fetch('../data/new_RSC.json')
            .then( response => {
                return response.json();
            })
            .then( data => {
                RSC.initRSCs(data.rscs);
                Preloader.setProgress(75);
                resolve();
            })
            .catch( error => {
                console.warn('Error when loading RSC data');
                console.error(error);
                reject();
            })
    });
}

async function loadTestRoutes() {
    return new Promise((resolve, reject) => {
        fetch('../data/new_Route.json')
            .then( response => {
                return response.json();
            })
            .then( data => {
                Route.initRoutes(data.routes);
                Preloader.setProgress(95);
                resolve();
            })
            .catch( error => {
                console.warn('Error when loading routes data');
                console.error(error);
                reject();
            })
    });
}

export { loadAllTestData };