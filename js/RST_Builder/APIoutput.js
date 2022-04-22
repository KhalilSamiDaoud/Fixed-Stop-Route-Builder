import * as RST from './rst.js';
import * as Station from './station.js';
import * as Modal from '../modal.js';
import * as Config from '../configuration.js';

const SAVE_CHANGES_BTN = document.getElementById('save_changes');
const PROC_PROG_BAR = document.querySelector('#processing_modal .modal-content progress');

SAVE_CHANGES_BTN.addEventListener('click', handleSaveClick);

const BaseURL = Config.envVars.API.URLbase;

window.onbeforeunload = function () {
    if (isEnabled)
        return 'Discard Changes?';
};

let isEnabled = false;
let fullyLoaded = false;

function handleSaveClick() {
    const PROC_MODAL = Modal.getModal('processing_modal');
    PROC_MODAL.open();

    let rstsObj = { rsts: [] };
    let stationsObj = { stations: [] };

    RST.getRSTs().forEach( rst => {
        rstsObj.rsts.push(rst.toJSON());
    });
    saveRSTs(rstsObj);

    Station.getStations().forEach( station => {
        stationsObj.stations.push(station.toJSON());
    });
    saveStations(stationsObj);
}

async function saveRSTs(rstsObj) {
    if (rstsObj.rsts.length)
        await fetch(BaseURL + Config.envVars.API.saveRSTs, {
            method: 'POST',
            body: JSON.stringify(rstsObj),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(() => {
            setProgress(50);
        });
    
    else
        setProgress(50);
}

async function saveStations(stationsObj) {
    if (stationsObj.stations.length)
        await fetch(BaseURL + Config.envVars.API.saveStations, {
            method: 'POST',
            body: JSON.stringify(stationsObj),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(() => {
            setProgress(100);
            PROC_MODAL.close();
            disableSaveBtn();
        });

    else {
        setProgress(100);
        PROC_MODAL.close();
        disableSaveBtn();
    }
}

function setProgress(progress) {
    PROC_PROG_BAR.setAttribute("value", progress);
}

function enableSaveBtn() {
    if (isEnabled || !fullyLoaded) return;

    SAVE_CHANGES_BTN.classList.add('enabled');
    SAVE_CHANGES_BTN.addEventListener('click', handleSaveClick);
    isEnabled = true;
}
enableSaveBtn();

function disableSaveBtn() {
    if (!isEnabled || !fullyLoaded) return;

    SAVE_CHANGES_BTN.classList.remove('enabled');
    SAVE_CHANGES_BTN.removeEventListener('click', handleSaveClick);
    isEnabled = false;
}

function startListening() {
    fullyLoaded = true;
}

export { enableSaveBtn, startListening };