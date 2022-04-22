import * as RSC from './rsc.js';
import * as Route from './route.js';
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

    let rscsObj = { rscs: [] };
    let routesObj = { routes: [] };

    RSC.getRSCs().forEach(rsc => {
        if(rsc.modified || rsc.isMarkedDeleted) {
            rscsObj.rscs.push(rsc.toJSON());
            rsc.modified = false;
        }
    });
    saveRSCs(rscsObj);

    Route.getRoutes().forEach(route => {
        if (route.modified|| route.isMarkedDeleted) {
            routesObj.routes.push(route.toJSON());
            route.modified = false;
        }
    });
    saveRoutes(routesObj);
}

async function saveRSCs(rscsObj) {
    if (rscsObj.rscs.length)
        await fetch(BaseURL + Config.envVars.API.saveRSCs, {
            method: 'POST',
            body: JSON.stringify(rscsObj),
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

async function saveRoutes(routesObj) {
    if (routesObj.routes.length)
        await fetch(BaseURL + Config.envVars.API.saveRoutes, {
            method: 'POST',
            body: JSON.stringify(routesObj),
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