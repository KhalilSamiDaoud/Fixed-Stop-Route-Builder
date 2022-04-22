import * as RouteBuilder from './routeBuilder.js';
import * as Toolbar from './toolbar_RSC.js';
import * as RouteMap from './routeMap.js';
import * as Modal from '../modal.js';
import * as Utils from '../utils.js';
import * as RSC from './rsc.js';

const MSG_ELEM = document.getElementById('confirmation_message');
const CONFIRM_BTN = document.getElementById('confirmation_confirm');
const REJECT_BTN = document.getElementById('confirmation_reject');

const rsts = new Map();

function initRSTs(RSTlist) {
    RSTlist.forEach( entry => {
        addRST(entry);
    });
}

function addRST(params) {
    rsts.set(params.id, new RST(params));
}

function updateRST(params) {
    rsts.get(params.id).update(params);
}

function removeRST(id) {
    if(!rsts.delete(id))
        consol.warn('removeRST: rst ' + id + 'does not exist');
}

function getRSTs() {
    return rsts;
}

function getRST(rstID) {
    return rsts.get(+rstID);
}

function clearRSTs() {
    rsts.forEach(rst => {
        rst.destroy();
    });

    rsts.clear();
}

class RST {
    constructor(params) {
        this.id = params.id;
        this.name = params.name;
        this.appliedDays = {
            array: params.appliedDays,
            string: params.appliedDays.join(', ')
        }
        this.attributes = params.attributes;
        this.color = {
            name: params.color,
            hex: Utils.resolveColor(params.color)
        }
        this.minStartLayover = params.minStartLayover;
        this.minEndLayover = params.minEndLayover;
        this.runTime = params.runTime;
        this.cycleTime = params.cycleTime;

        //To allow repeats, stations are a sequential list of objects containing a stop id, and stop data
        this.stations = [];
        params.stations.forEach(stopEntry => {
            this.stations.push(stopEntry);
        });

        this.stopSequence = this.stations.map( station => station.id);

        this.elem = this.#constructElem();
    }

    static bindedDeleteRST = null;
    static deleteCallback = null;
    static deleteElem = null;
    bindedDeleteConfirmEvent = this.#handleDeleteConfirm.bind(this);
    bindedDeleteRejectEvent = this.#handleDeleteReject.bind(this);

    update() {
        //fill
    }

    destroy() {
        //fill
    }

    #constructElem() {
        let elem = document.createElement('div');

        elem.classList.add('rst-block', this.color.name);
        elem.setAttribute('data-oid', this.id);

        //delete event is bound to the remove icon at time of cloning into route builder
        elem.deleteBtn = document.createElement('a');
        elem.deleteBtn.icon = document.createElement('span');
        elem.deleteBtn.icon.innerText = '✖';

        elem.name = document.createElement('p');
        elem.name.title = this.name;
        elem.name.innerText = this.name;

        elem.appendChild(elem.deleteBtn);
        elem.appendChild(elem.name);
        elem.deleteBtn.appendChild(elem.deleteBtn.icon);

        return elem;
    }

    handleBuilderRemove(RSTelem, callback) {
        if (!RSTelem.nextElementSibling.classList.contains('rsc-block') ||
            RSTelem.previousElementSibling.classList.contains('rst-block')) {

            RSTelem.remove();
            RouteBuilder.currSortable.updateRouteRSCs();
            RouteBuilder.currSortable.route.updateStopSequence();
            RouteMap.getMapRoute(RouteBuilder.currSortable.route.id).update(); 
        }

        else {
            const CONFIRMATION_MODAL = Modal.getModal('confirmation_modal');

            let RSCname = RSTelem.nextElementSibling.querySelector('.rsc-block-content h5').innerText;
            MSG_ELEM.innerText = 'Removing this RST will delete "' + RSCname + '" and its variations';

            RST.deleteElem = RSTelem;
            RST.deleteCallback = callback;

            CONFIRM_BTN.addEventListener('click', this.bindedDeleteConfirmEvent);
            REJECT_BTN.addEventListener('click', this.bindedDeleteRejectEvent);

            CONFIRMATION_MODAL.open();
            RST.bindedDeleteRST = this;
        }
    }

    #handleDeleteConfirm() {
        CONFIRM_BTN.removeEventListener('click', RST.bindedDeleteRST.bindedDeleteConfirmEvent);
        REJECT_BTN.removeEventListener('click', RST.bindedDeleteRST.bindedDeleteRejectEvent);

        let targetRSC = RSC.getRSC(+RST.deleteElem.nextElementSibling.dataset.oid);

        if (targetRSC.isMultiRSC) {
            targetRSC.variationRSCs.forEach( rsc => {
                Toolbar.removeRSCdata(rsc);
                rsc.isMarkedDeleted = true;
            });
        }

        Toolbar.removeRSCdata(targetRSC);
        targetRSC.isMarkedDeleted = true;

        RST.deleteCallback(RST.deleteElem);
        RST.bindedDeleteRST = null;
        RST.deleteElem = null;
        RST.deleteCallback = null;
    }

    #handleDeleteReject() {
        REJECT_BTN.removeEventListener('click', RST.bindedDeleteRST.bindedDeleteRejectEvent);
        CONFIRM_BTN.removeEventListener('click', RST.bindedDeleteRST.bindedDeleteConfirmEvent);

        RST.bindedDeleteRST = null;
        RST.deleteElem = null;
        RST.deleteCallback = null;
    }
}

export { initRSTs, addRST, getRSTs, getRST, removeRST, updateRST, clearRSTs, RST };