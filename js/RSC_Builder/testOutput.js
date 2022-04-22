import * as RSC from './rsc.js';
import * as Route from './route.js';
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

    let rscsObj = { rscs: [] };
    let routesObj = { routes: [] };

    RSC.getRSCs().forEach(rsc => {
        if(rsc.modified|| rsc.isMarkedDeleted) {
            rscsObj.rscs.push(rsc.toJSON());
            rsc.modified = false;
        }
    });
    console.log(JSON.stringify(rscsObj));
    setProgress(50);

    Route.getRoutes().forEach(route => {
        if (route.modified|| route.isMarkedDeleted) {
            routesObj.routes.push(route.toJSON());
            route.modified = false;
        }
    });
    console.log(JSON.stringify(routesObj));

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