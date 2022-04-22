import * as Station from './station.js';
import * as RST from './rst.js';
import * as Preloader from '../preloader.js';

const BaseURL = Config.envVars.API.URLbase;

async function loadAllTestData() {
    await loadTestStations();
    await loadTestRSTs();
}

async function loadTestStations() {
    return new Promise((resolve, reject) => {
        fetch(BaseURL + Config.envVars.API.loadStations)
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
        fetch(BaseURL + Config.envVars.API.loadRSTs)
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