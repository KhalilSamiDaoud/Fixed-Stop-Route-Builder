import * as Config from '../configuration.js';
import * as Station from './station.js';
import * as Toolbar from './toolbar_RST.js';
import * as RSTmap from './rstMaps.js';
import * as Modal from '../modal.js';
import * as RST from './rst.js';
import * as Utils from '../utils.js'
import * as APIoutput from './testOutput.js';

if (!document.getElementById('rstBuilder_css')) { Config.loadStyleSheet('rstBuilder'); }

const RST_SELECT_DD = document.getElementById('select_rst_dd');
const TOGGLE_RST_LIST_BTN = document.getElementById('toggle_rst_list');
const ADD_NEW_RST_BTN = document.getElementById('add_new_rst');
const EDIT_CURR_RST = document.getElementById('edit_curr_rst');
const DELETE_CURR_RST = document.getElementById('delete_curr_rst');
const RST_BUILDER_CONTAINER = document.getElementById('rst_builder_container');
const RST_MODAL_ELEM = document.getElementById('rst_modal');
const CONFIRM_BTN = document.getElementById('confirmation_confirm');
const MSG_ELEM = document.getElementById('confirmation_message');
const RST_BUILDER_HEADER = document.getElementById('rst_builder_header');

const LIST_POS = {
    only: 0,
    start: 1,
    middle: 2,
    end: 3
};

const DAY_INPUT_NAMES = [
    { name: 'rst_monday', code: 'M' },
    { name: 'rst_tuesday', code: 'T' },
    { name: 'rst_wednesday', code: 'W' },
    { name: 'rst_thursday', code: 'R' },
    { name: 'rst_friday', code: 'F' },
    { name: 'rst_saturday', code: 'S' },
    { name: 'rst_sunday', code: 'U' }
];

const RSTbuilderEntries = new Map(); //key: rst.id, val: RSTbuilderEntry

const ghostPlaceHolder = Utils.createElement('div', 'rst-ghost-placeholder', { id: 'ghostPlaceHolder'});
const endPlaceHolder = Utils.createElement('div', 'rst-end-placeholder', { id: 'endPlaceHolder', ondragover: handleChildDragOver });

const lastTriggeredDragOver = {
    val: null,
    set: function (newVal) { lastTriggeredDragOver.val = newVal; }
}
const placeholderSwitch = {
    val: false,
    set: function (newVal) { placeholderSwitch.val = newVal; }
}
const entryCounter = {
    val: 0,
    set: function (newVal) { entryCounter.val = newVal; }
}
const elem = {
    val: null,
    set: function (newVal) { elem.val = newVal; }
}

let currRST = null;
let RSTBtnMode = 'off';

function initRSTbuilder() {
    ADD_NEW_RST_BTN.addEventListener(
        'click',
        RSTbuilderEntry.openNewRSTModal
    );
    RST_MODAL_ELEM.querySelector('#rst_modal_cancel').addEventListener(
        'click',
        RSTbuilderEntry.handleRSTCancel
    );
    TOGGLE_RST_LIST_BTN.addEventListener(
        'click',
        handlePanelToggle
    );
    RST_SELECT_DD.addEventListener(
        'change', 
        handleRSTselect
    );

    RST.getRSTs().forEach( rst => {
        addRSTbuilderEntry(rst);
    });

    if (RST_SELECT_DD.getElementsByTagName('option').length) {
        RST_SELECT_DD.getElementsByTagName('option')[0].selected = 'selected';
        Toolbar.setToolBarData(RST.getRST(RST_SELECT_DD.getElementsByTagName('option')[0].value));
        RSTmap.setMapRoute(RST.getRST(RST_SELECT_DD.getElementsByTagName('option')[0].value));

        getRSTbuilderEntry(+RST_SELECT_DD.getElementsByTagName('option')[0].value).setBuilder();
        currRST = getRSTbuilderEntry(+RST_SELECT_DD.getElementsByTagName('option')[0].value);

        toggleRSTActions('on');
    }
}

function addRSTbuilderEntry(rst) {
    RSTbuilderEntries.set(rst.id, new RSTbuilderEntry(rst));

    return RSTbuilderEntries.get(rst.id);
}

function updateRSTbuilderEntry(rst) {
    if (!RSTbuilderEntries.get(rst.id))
        addRSTbuilderEntry(rst);

    RSTbuilderEntries.get(rst.id).update(rst);
}

function getRSTbuilderEntry(rstID) {
    return RSTbuilderEntries.get(rstID);
}

function removeRSTbuilderEntry(rst) {
    RSTbuilderEntries.get(rst.id).destroy();
}

function cleaRSTbuilderEntries() {
    RSTbuilderEntries.forEach(entry => {
        entry.destroy();
    });

    RSTbuilderEntries.clear();
}

function handleRSTselect(e) {
    RSTbuilderEntries.get(+e.target.value).setBuilder();

    Toolbar.setToolBarData(currRST.rst);
    RSTmap.setMapRoute(currRST.rst, true);
}

function handlePanelToggle() {
    let elem = document.getElementById('rst_list');
    let collapseClass = 'collapsed';

    TOGGLE_RST_LIST_BTN.innerText = (TOGGLE_RST_LIST_BTN.innerText === 'expand_less') ? 'expand_more' : 'expand_less';

    elem.style.height = '';
    elem.style.transition = 'none';

    const startHeight = window.getComputedStyle(elem).height;

    elem.classList.toggle(collapseClass);
    const height = window.getComputedStyle(elem).height;

    elem.style.height = startHeight;

    requestAnimationFrame(() => {
        elem.style.transition = '';

        requestAnimationFrame(() => {
            elem.style.height = height
        })
    })

    function transitionHandler() {
        elem.style.height = '';
        elem.removeEventListener('transitionend', transitionHandler);
    }

    elem.addEventListener('transitionend', transitionHandler);
}

//mode : 'on' / 'off'
function toggleRSTActions(mode) {
    if (!mode || mode === RSTBtnMode) return;

    switch(mode) {
        case 'on':
            EDIT_CURR_RST.addEventListener(
                'click',
                RSTbuilderEntry.openEditRSTModal
            );
            DELETE_CURR_RST.addEventListener(
                'click',
                RSTbuilderEntry.handleRSTDelete
            );

            EDIT_CURR_RST.classList.remove('disabled');
            DELETE_CURR_RST.classList.remove('disabled');
            RSTBtnMode = 'on';
            break;
        case 'off':
            EDIT_CURR_RST.removeEventListener(
                'click',
                RSTbuilderEntry.openEditRSTModal
            );
            DELETE_CURR_RST.removeEventListener(
                'click',
                RSTbuilderEntry.handleRSTDelete
            );

            EDIT_CURR_RST.classList.add('disabled');
            DELETE_CURR_RST.classList.add('disabled');
            RSTBtnMode = 'off';
            break;
        default:
            console.warn('Invalid mode passed to toggleRSTActions()');
            break;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function handleChildDragOver(e) {
    e.preventDefault();

    lastTriggeredDragOver.set(e.currentTarget);

    if (placeholderSwitch.val)
        currRST.elem.insertBefore(ghostPlaceHolder, e.currentTarget);
}

function handleDragEnter(e) {
    e.preventDefault();
    entryCounter.set(++entryCounter.val);
}

function handleDragLeave(e) {
    e.preventDefault();
    entryCounter.set(--entryCounter.val);

    if (entryCounter.val === 0 && [...currRST.elem.children].includes(ghostPlaceHolder))
        currRST.elem.removeChild(ghostPlaceHolder);
}

function handleDrop(e) {
    e.preventDefault();
    if (e.currentTarget !== ghostPlaceHolder &&
        e.currentTarget !== currRST.elem &&
        e.currentTarget !== endPlaceHolder) return;

    const data = e.dataTransfer.getData("text/plain");
    let targetStation = Station.getStation(+data);
    let pos;

    if (currRST.elem.children.length === 2)
        pos = LIST_POS.only
    else if (currRST.elem.firstElementChild === ghostPlaceHolder) {
        pos = LIST_POS.start;
        ghostPlaceHolder.nextElementSibling.iconSection.firstElementChild.classList.remove('hide');
    }
    else if (endPlaceHolder.previousElementSibling === ghostPlaceHolder) {
        pos = LIST_POS.end;
        ghostPlaceHolder.previousElementSibling.iconSection.lastElementChild.classList.remove('hide');
    }
    else 
        pos = LIST_POS.middle;

    ghostPlaceHolder.replaceWith(currRST.constructBuilderEntry(
        targetStation, 
        {
        arrivalTime: "",
        departureTime: ""
        }, 
        pos
    ));

    RSTbuilderEntry.validateRSTBuilder();

    placeholderSwitch.set(false);
    lastTriggeredDragOver.set(null);
    entryCounter.set(0);
    elem.set(null);
}

class RSTbuilderEntry {
    constructor(rst) {
        this.rst = rst;

        this.#constructElem();
    }

    bindedUpdateEvent = RSTbuilderEntry.handleRSTUpdate.bind(this);

    setBuilder() {
        if (currRST === this) return;

        if (currRST === null) {
            RST_BUILDER_CONTAINER.appendChild(this.elem);
            currRST = this;
        }
        else {
            currRST.elem.remove();
            RST_BUILDER_CONTAINER.appendChild(this.elem);
            currRST = this;
        }
    }

    #constructElem() {
        const tempElem = document.createElement('div');
        tempElem.classList.add('rst-builder', 'scrollbar-primary');
        tempElem.setAttribute('data-oid', this.rst.id);
        tempElem.addEventListener('dragover', handleDragOver);
        tempElem.addEventListener('dragenter', handleDragEnter);
        tempElem.addEventListener('dragleave', handleDragLeave);
        tempElem.addEventListener('drop', handleDrop);

        const tempOption = document.createElement('option');
        tempOption.innerText = this.rst.name;
        tempOption.value = this.rst.id;

        RST_SELECT_DD.appendChild(tempOption);

        this.elem = tempElem;

        let tempPos = null;

        for (let i = 0; i < this.rst.stations.length; i++) {

            let hasIcon = false;
            this.rst.stations[i].wayPoints.forEach( waypoint => {
                tempElem.appendChild(this.constructWaypointEntry(waypoint, hasIcon));
                hasIcon = true;
            });

            if (this.rst.stations.length === 1)
                tempPos = LIST_POS.only;
            else if (i === 0)
                tempPos = LIST_POS.start;
            else if (i === (this.rst.stations.length - 1))
                tempPos = LIST_POS.end;
            else
                tempPos = LIST_POS.middle;

            tempElem.appendChild(this.constructBuilderEntry(Station.getStation(this.rst.stations[i].id), this.rst.stations[i], tempPos));
        }
    }

    constructWaypointEntry(waypoint, hasIcon) {
        const tempElem = document.createElement('div');
        tempElem.classList.add('waypoint-entry');
        tempElem.setAttribute('data-lat', waypoint.lat);
        tempElem.setAttribute('data-lng', waypoint.lng);
        tempElem.innerHTML = '<div class="detour material-icons">directions</div>';

        tempElem.addEventListener('click', this.#handleWaypointDelete);
        
        if (hasIcon) tempElem.style.visibility = 'hidden';

        return tempElem;
    }

    constructBuilderEntry(station, RSTstationData, pos) {
        let tempBarElem = null;
        const isCircleIcon = (station.styleClasses.container === 'circle-container') ? true : false;

        const tempCircleBar = document.createElement('div');
        tempCircleBar.classList.add('bar');

        const tempDiamondBar = document.createElement('div');
        tempDiamondBar.classList.add('bar-short');

        const tempElem = document.createElement('div');
        tempElem.classList.add('stop-entry');
        tempElem.setAttribute('data-oid', station.id);
        tempElem.addEventListener('dragover', handleChildDragOver)

        tempElem.iconSection = document.createElement('div');
        tempElem.iconSection.classList.add('stop-icon');
        tempElem.appendChild(tempElem.iconSection);
        
        tempBarElem = (isCircleIcon) ? tempCircleBar.cloneNode() : tempDiamondBar.cloneNode();
        if (pos === LIST_POS.start || pos === LIST_POS.only) tempBarElem.classList.add('hide');
        tempElem.iconSection.appendChild(tempBarElem);

        tempElem.iconSection.iconContainer = document.createElement('div');
        tempElem.iconSection.iconContainer.classList.add(station.styleClasses.container, (station.color.name + '-outline'));
        tempElem.iconSection.appendChild(tempElem.iconSection.iconContainer);

        tempElem.iconSection.iconContainer.icon = document.createElement('i');
        tempElem.iconSection.iconContainer.icon.innerText = station.styleClasses.icon;
        tempElem.iconSection.iconContainer.icon.classList.add('material-icons');
        tempElem.iconSection.iconContainer.appendChild(tempElem.iconSection.iconContainer.icon);

        tempBarElem = (isCircleIcon) ? tempCircleBar.cloneNode() : tempDiamondBar.cloneNode();
        if (pos === LIST_POS.end || pos === LIST_POS.only) tempBarElem.classList.add('hide');
        tempElem.iconSection.appendChild(tempBarElem);

        tempElem.dataSection = document.createElement('div');
        tempElem.dataSection.classList.add('stop-data');
        tempElem.appendChild(tempElem.dataSection);

        tempElem.dataSection.stationName = document.createElement('p');
        tempElem.dataSection.stationName.innerHTML = '<b class="' + station.styleClasses.typeColor + '">[' + station.type + ']</b>&nbsp;' + station.name;
        tempElem.dataSection.appendChild(tempElem.dataSection.stationName);

        tempElem.dataSection.inputs = document.createElement('div');
        tempElem.dataSection.appendChild(tempElem.dataSection.inputs);

        tempElem.dataSection.inputs.arrivalTime = document.createElement('input');
        tempElem.dataSection.inputs.arrivalTime.setAttribute('type', 'time');
        tempElem.dataSection.inputs.arrivalTime.setAttribute('required', 'true');
        tempElem.dataSection.inputs.arrivalTime.value = RSTstationData.arrivalTime;
        tempElem.dataSection.inputs.arrivalTime.addEventListener('change', RSTbuilderEntry.validateRSTBuilder);
        tempElem.dataSection.inputs.appendChild(tempElem.dataSection.inputs.arrivalTime);

        tempElem.dataSection.inputs.arrow = document.createElement('span');
        tempElem.dataSection.inputs.arrow.innerHTML = '<span>&nbsp;&#8594;&nbsp;</span>';
        tempElem.dataSection.inputs.appendChild(tempElem.dataSection.inputs.arrow);

        tempElem.dataSection.inputs.departureTime = document.createElement('input');
        tempElem.dataSection.inputs.departureTime.setAttribute('type', 'time');
        tempElem.dataSection.inputs.departureTime.setAttribute('required', 'true');
        tempElem.dataSection.inputs.departureTime.value = RSTstationData.departureTime;
        tempElem.dataSection.inputs.departureTime.addEventListener('change', RSTbuilderEntry.validateRSTBuilder);
        tempElem.dataSection.inputs.appendChild(tempElem.dataSection.inputs.departureTime);

        tempElem.buttonSection = document.createElement('div');
        tempElem.buttonSection.classList.add('stop-buttons', 'push-right');
        tempElem.appendChild(tempElem.buttonSection);

        tempElem.buttonSection.deleteButton = document.createElement('i');
        tempElem.buttonSection.deleteButton.classList.add('material-icons', 'icon-btn-flat', 'small');
        tempElem.buttonSection.deleteButton.innerText = 'close';
        tempElem.buttonSection.deleteButton.addEventListener('click', RSTbuilderEntry.handleRSTEntryDelete);
        tempElem.buttonSection.appendChild(tempElem.buttonSection.deleteButton);

        return tempElem;
    }

    setWaypointData(waypoints, index) {
        let count = 0;
        let target;

        for (let i=0; i < this.elem.children.length; i++) {
            if (!this.elem.children[i].classList.contains('waypoint-entry')) {
                if (count === index) {
                    target = this.elem.children[i];
                    break;
                }
                count++;
            }
        }

        while (target.previousElementSibling.classList.contains('waypoint-entry')) {
            target.previousElementSibling.remove();
        }

        let hasIcon = false;
        waypoints.forEach( waypoint => {
            target.before(this.constructWaypointEntry(waypoint, hasIcon));
            hasIcon = true;
        });
    }

    #handleWaypointDelete(e) {
        let target = e.currentTarget;

        while(target.nextElementSibling.classList.contains('waypoint-entry'))
            target.nextElementSibling.remove();
        while(target.previousElementSibling.classList.contains('waypoint-entry'))
            target.previousElementSibling.remove();

        target.remove();
        RSTbuilderEntry.validateRSTBuilder();
    }

    static openNewRSTModal() {
        const RST_MODAL = Modal.getModal('rst_modal');

        RST_MODAL_ELEM.querySelector('.modal-header h1').innerText = 'Add New RST';
        RST_MODAL_ELEM.querySelector('#rst_modal_submit').innerText = 'ADD';

        RST_MODAL_ELEM.querySelector('#rst_modal_submit').addEventListener(
            'click',
            RSTbuilderEntry.handleRSTSubmit
        );

        RST_MODAL.open();
    }

    static openEditRSTModal() {
        const RST_MODAL = Modal.getModal('rst_modal');
        const RST_FORM = document.forms['rst_form'];

        RST_MODAL_ELEM.querySelector('.modal-header h1').innerText = 'Edit RST';
        RST_MODAL_ELEM.querySelector('#rst_modal_submit').innerText = 'UPDATE';

        RST_FORM.elements['rst_name'].value = currRST.rst.name;
        RST_FORM.elements['rst_color'].value = currRST.rst.color.name;
        RST_FORM.elements['rst_start_layover'].value = currRST.rst.minStartLayover;
        RST_FORM.elements['rst_end_layover'].value = currRST.rst.minEndLayover;
        DAY_INPUT_NAMES.forEach(day => {
            RST_FORM.elements[day.name].checked = currRST.rst.appliedDays.array.includes(day.code);
        });

        RST_MODAL_ELEM.querySelector('#rst_modal_submit').addEventListener(
            'click',
            currRST.bindedUpdateEvent
        );

        RST_MODAL.open();
    }

    static handleRSTSubmit() {
        const RST_FORM = document.forms['rst_form'];
        const RST_MODAL = Modal.getModal('rst_modal');

        let formData = new FormData(RST_FORM);
        let daysOfTheWeek = [];

        if (RSTbuilderEntry.validateRSTform(formData)) {
            DAY_INPUT_NAMES.forEach(day => {
                if (RST_FORM.elements[day.name].checked)
                    daysOfTheWeek.push(day.code);
            });

            const params = {
                id: Math.random(), //needs to be given from backend on save
                stations: [],
                name: formData.get('rst_name'),
                color: formData.get('rst_color'),
                minStartLayover: formData.get('rst_start_layover'),
                minEndLayover: formData.get('rst_end_layover'),
                appliedDays: daysOfTheWeek
            }

            let newRST = RST.addRST(params, true);
            addRSTbuilderEntry(newRST).setBuilder();
            RST_SELECT_DD.value = newRST.id;
            Toolbar.setToolBarData(currRST.rst);
            RSTmap.addRSTmapEntry(currRST.rst)
            RSTmap.setMapRoute(currRST.rst, true);
            toggleRSTActions('on');

            RST_MODAL_ELEM.querySelector('#rst_modal_submit').removeEventListener('click', RSTbuilderEntry.handleRSTSubmit);
            RST_FORM.reset();
            RST_MODAL.close();
        }
    }

    static handleRSTUpdate() {
        const RST_FORM = document.forms['rst_form'];
        const RST_MODAL = Modal.getModal('rst_modal');

        let formData = new FormData(RST_FORM);
        let daysOfTheWeek = [];

        if (RSTbuilderEntry.validateRSTform(formData)) {
            DAY_INPUT_NAMES.forEach(day => {
                if (RST_FORM.elements[day.name].checked)
                    daysOfTheWeek.push(day.code);
            });

            const newParams = {
                name: formData.get('rst_name'),
                color: formData.get('rst_color'),
                minStartLayover: formData.get('rst_start_layover'),
                minEndLayover: formData.get('rst_end_layover'),
                appliedDays: daysOfTheWeek
            }

            RST_SELECT_DD.options[RST_SELECT_DD.selectedIndex].innerText = newParams.name;
            currRST.rst.update(newParams);
            Toolbar.setToolBarData(currRST.rst);
            RSTmap.setMapRoute(currRST.rst);

            RST_MODAL_ELEM.querySelector('#rst_modal_submit').removeEventListener('click', currRST.bindedUpdateEvent);
            RST_FORM.reset();
            RST_MODAL.close();
        }
    }

    static handleRSTDelete() {
        const CONFIRMATION_MODAL = Modal.getModal('confirmation_modal');
        MSG_ELEM.innerText = 'Delete RST: ' + currRST.rst.name + '?';

        CONFIRM_BTN.addEventListener(
            'click',
            RSTbuilderEntry.handleDeleteConfirm
        );

        CONFIRMATION_MODAL.open();
    }

    static handleRSTEntryDelete(e) {
        let targetEntry = e.currentTarget.parentElement.parentElement;

        if (currRST.elem.children.length === 1)
            true

        else if (currRST.elem.firstElementChild === targetEntry) {
            let tempElem = targetEntry.nextElementSibling;

            while (tempElem) {
                if (tempElem.classList.contains('stop-entry')) {
                    tempElem.iconSection.firstElementChild.classList.add('hide');
                    break;
                }
                else {
                    let temp = tempElem.nextElementSibling;
                    tempElem.remove();
                    tempElem = temp;
                }
            }
        }

        else if (currRST.elem.lastElementChild === targetEntry) {
            let tempElem = targetEntry.previousElementSibling;

            while (tempElem) {
                if (tempElem.classList.contains('stop-entry')) {
                    tempElem.iconSection.lastElementChild.classList.add('hide');
                    break;
                }
                else {
                    let temp = tempElem.previousElementSibling;
                    tempElem.remove();
                    tempElem = temp;
                }
            }
        }

        else {
            while(targetEntry.previousElementSibling.classList.contains('waypoint-entry')) {
                targetEntry.previousElementSibling.remove();
            }
        }

        targetEntry.remove();
        RSTbuilderEntry.validateRSTBuilder();
    }

    static handleDeleteConfirm() {
        RST_SELECT_DD.options[RST_SELECT_DD.selectedIndex].remove();
        currRST.destroy();

        if (RST_SELECT_DD.options.length !== 0) {
            RST_SELECT_DD.getElementsByTagName('option')[0].selected = 'selected';
            getRSTbuilderEntry(+RST_SELECT_DD.getElementsByTagName('option')[0].value).setBuilder();
            Toolbar.setToolBarData(currRST.rst);
            RSTmap.setMapRoute(currRST.rst, true);
        }
        else {
            currRST.elem.remove();
            Toolbar.clearToolBarData();
            RSTmap.clearMapRoute();
            currRST = null;
            toggleRSTActions('off');
        }

        CONFIRM_BTN.removeEventListener(
            'click',
            RSTbuilderEntry.handleDeleteConfirm
        );
    }

    static handleRSTCancel() {
        const RST_FORM = document.forms['rst_form'];

        [...RST_FORM.elements].forEach(element => {
            element.parentElement.classList.remove('invalid');
        });
        RST_FORM.elements['rst_monday'].parentElement.parentElement.classList.remove('invalid');

        RST_MODAL_ELEM.querySelector('#rst_modal_submit').removeEventListener(
            'click',
            currRST.bindedUpdateEvent,
        );
        RST_MODAL_ELEM.querySelector('#rst_modal_submit').removeEventListener(
            'click',
            RSTbuilderEntry.handleRSTSubmit,
        );

        RST_FORM.reset();
    }

    static validateRSTform(formData) {
        const RST_FORM = document.forms['rst_form'];
        let allValid = true;
        let checked = 0;

        DAY_INPUT_NAMES.forEach(day => {
            if (RST_FORM.elements[day.name].checked)
                checked++;
        });

        if (!checked) {
            RST_FORM.elements['rst_monday'].parentElement.parentElement.classList.add('invalid');
            allValid = false;
        }
        else
            RST_FORM.elements['rst_monday'].parentElement.parentElement.classList.remove('invalid');

        [...formData.keys()].forEach(input => {
            if (!formData.get(input)) {
                RST_FORM.elements[input].parentElement.classList.add('invalid');
                allValid = false;
            }
            else
                RST_FORM.elements[input].parentElement.classList.remove('invalid');
        });

        if (!Utils.stringIsPositiveInt(formData.get('rst_start_layover'))) {
            RST_FORM.elements['rst_start_layover'].parentElement.classList.add('invalid');
            allValid = false;
        }
        else
            RST_FORM.elements['rst_start_layover'].parentElement.classList.remove('invalid');

        if (!Utils.stringIsPositiveInt(formData.get('rst_end_layover'))) {
            RST_FORM.elements['rst_end_layover'].parentElement.classList.add('invalid');
            allValid = false;
        }
        else
            RST_FORM.elements['rst_end_layover'].parentElement.classList.remove('invalid');

        return allValid;
    }

    static validateRSTBuilder() {
        let lastSeenTime = -1;
        let isStillValid = true;

        RST_BUILDER_HEADER.classList.remove('warn');

        [...currRST.elem.children].forEach( node => {
            if (node.classList.contains('stop-entry')) {
                let arrivalElem = node.querySelector('.stop-data > div > input:first-of-type');
                let departureElem = node.querySelector('.stop-data > div > input:last-of-type');
                let arrivalTime = (arrivalElem.value) ? Utils.parseTime(arrivalElem.value) : -1;
                let departureTime = (departureElem.value) ? Utils.parseTime(departureElem.value) : -1;

                if (!isStillValid) {
                    arrivalElem.classList.add('attention');
                    departureElem.classList.add('attention');
                }
                else if (arrivalTime < departureTime && arrivalTime > lastSeenTime) {
                    lastSeenTime = departureTime;
                    arrivalElem.classList.remove('attention');
                    departureElem.classList.remove('attention');
                }
                else {
                    isStillValid = false;
                    arrivalElem.classList.add('attention');
                    departureElem.classList.add('attention');
                    RST_BUILDER_HEADER.classList.add('warn');
                    currRST.rst.valid = false;
                }
            }
        });

        if (isStillValid) {
            currRST.rst.updateStations(currRST.elem);
            Toolbar.setToolBarData(currRST.rst);
            RSTmap.setMapRoute(currRST.rst);
            APIoutput.enableSaveBtn();
        }
    }
}

export { initRSTbuilder, updateRSTbuilderEntry, removeRSTbuilderEntry, cleaRSTbuilderEntries, getRSTbuilderEntry, 
        lastTriggeredDragOver, placeholderSwitch, entryCounter, elem, endPlaceHolder, currRST };