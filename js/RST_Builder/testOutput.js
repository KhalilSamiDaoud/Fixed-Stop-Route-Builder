import * as RST from './rst.js';
import * as Station from './station.js';
import * as Modal from '../modal.js';

const SAVE_CHANGES_BTN = document.getElementById('save_changes');
const PROC_PROG_BAR = document.querySelector('#processing_modal .modal-content progress');

SAVE_CHANGES_BTN.addEventListener('click', handleSaveClick);

window.onbeforeunload = function () {
    if(isEnabled)
        return 'Discard Changes?';
};

let isEnabled = false;
let isListening = false;

function handleSaveClick() {
    const PROC_MODAL = Modal.getModal('processing_modal');
    PROC_MODAL.open();

    let rstsObj = { rsts: [] };
    let stationsObj = { stations: [] };

    RST.getRSTs().forEach(rst => {
        if(rst.modified) {
            rstsObj.rsts.push(rst.toJSON());
            rst.modified = false;
        }
    });
    console.log(JSON.stringify(rstsObj));
    setProgress(50);

    Station.getStations().forEach(station => {
        if (station.modified) {
            stationsObj.stations.push(station.toJSON());
            station.modified = false;
        }
    });
    console.log(JSON.stringify(stationsObj));

    let outputTimeout = setTimeout( () => {
        setProgress(100);
        PROC_MODAL.close();
        disableSaveBtn();
        clearTimeout(outputTimeout);
    }, 150);
}

function enableSaveBtn() {
    if (isEnabled || !isListening) return;

    SAVE_CHANGES_BTN.classList.add('enabled');
    SAVE_CHANGES_BTN.addEventListener('click', handleSaveClick);
    isEnabled = true;
}

function disableSaveBtn() {
    if (!isEnabled || !isListening) return;

    SAVE_CHANGES_BTN.classList.remove('enabled');
    SAVE_CHANGES_BTN.removeEventListener('click', handleSaveClick);
    isEnabled = false;
}

function setProgress(progress) {
    PROC_PROG_BAR.setAttribute("value", progress);
}

function startListening() {
    isListening = true;
}

export { enableSaveBtn, startListening, isListening };