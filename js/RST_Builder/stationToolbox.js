import * as Config from '../configuration.js';
import * as RSTbuilder from './rstBuilder.js';
import * as Station from './station.js';
import * as Modal from '../modal.js';
import * as RSTMap from './rstMaps.js';

if (!document.getElementById('rstToolbox_css')) { Config.loadStyleSheet('stationToolbox'); }
if (!document.getElementById('rst&rsc_css')) { Config.loadStyleSheet('rst&rsc'); }

const STATION_TOOLBOX_LIST = document.getElementById('station_toolbox_list');
const TOGGLE_STATION_LIST_BTN = document.getElementById('toggle_station_list');
const ADD_NEW_STATION_BTN = document.getElementById('add_new_station');
const STATION_MODAL_ELEM = document.getElementById('station_modal');
const CONFIRM_BTN = document.getElementById('confirmation_confirm');
const REJECT_BTN = document.getElementById('confirmation_reject');
const MSG_ELEM = document.getElementById('confirmation_message');

//id by rst.id
const toolboxEntries = new Map();

function initToolbox() {
    TOGGLE_STATION_LIST_BTN.addEventListener(
        'click',
        handlePanelToggle
    );
    ADD_NEW_STATION_BTN.addEventListener(
        'click',
        StationToolboxEntry.openNewStationModal
    )

    Station.getStations().forEach(station => {
        addToolboxEntry(station);
    });
}

function addToolboxEntry(station) {
    toolboxEntries.set(station.id, new StationToolboxEntry(station));
}

function updateToolboxEntry(station) {
    if (!toolboxEntries.get(station.id))
        addToolboxEntry(station);

    toolboxEntries.get(station.id).update(station);
}

function removeToolboxEntry(station) {
    toolboxEntries.get(station.id).destroy();
}

function clearToolboxEntries() {
    toolboxEntries.forEach(entry => {
        entry.destroy();
    });

    toolboxEntries.clear();
}

function handlePanelToggle() {
    let elem = document.getElementById('station_toolbox');
    let collapseClass = 'collapsed';

    TOGGLE_STATION_LIST_BTN.innerText = (TOGGLE_STATION_LIST_BTN.innerText === 'expand_less') ? 'expand_more' : 'expand_less';

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

//elem ID = station.id + '-toolbox'
class StationToolboxEntry {
    constructor(station) {
        this.station = station;

        this.elem = this.#constructElement();
        this.noteElem = this.#constructNote();
    }

    bindedUpdateEvent = this.#handleStationUpdate.bind(this);
    bindedDeleteEvent = this.#handleStationDelete.bind(this);
    bindedDeleteConfirm = this.#handleDeleteConfirm.bind(this);
    bindedDeleteReject = this.#handleDeleteCancel.bind(this);
    bindedStationCancel = this.#handleStationCancel.bind(this);

    destroy() {
        toolboxEntries.delete(this.station.id);
        STATION_TOOLBOX_LIST.removeChild(this.elem);
    }

    update() {
        this.elem = this.#constructElement('replace');

        this.noteElem.remove();
        this.noteElem = this.#constructNote();
    }

    #constructElement(mode = 'append') {
        let tempElem = document.createElement('li');
        tempElem.classList.add('station-entry');

        tempElem.rstElem = this.station.elem.cloneNode(true);
        tempElem.rstElem.setAttribute('draggable', 'true');
        tempElem.rstElem.setAttribute('data-oid', this.station.id);

        tempElem.rstElem.addEventListener('dragstart', this.#handleDragStart.bind(this));
        tempElem.rstElem.addEventListener('dragend', this.#handleDragEnd.bind(this));

        tempElem.dataElem = document.createElement('div');
        tempElem.dataElem.classList.add('station-data');
        
        tempElem.dataElem.name = document.createElement('p');
        tempElem.dataElem.name.innerText = this.station.name;
        tempElem.dataElem.appendChild(tempElem.dataElem.name);

        tempElem.dataElem.address = document.createElement('p');
        tempElem.dataElem.address.innerText = this.station.address;
        tempElem.dataElem.appendChild(tempElem.dataElem.address);

        tempElem.dataElem.info = document.createElement('p');
        tempElem.dataElem.info.classList.add(this.station.styleClasses.typeColor);
        tempElem.dataElem.info.innerHTML = this.#formatInfo();
        tempElem.dataElem.info.noteBtn = tempElem.dataElem.info.querySelector('p > span');
        tempElem.dataElem.info.noteBtn.firstElementChild.addEventListener('click', this.#handleNoteOpen.bind(this));
        if (!this.station.notes) tempElem.dataElem.info.noteBtn.classList.add('hide');
        tempElem.dataElem.appendChild(tempElem.dataElem.info);


        tempElem.buttons = document.createElement('div');
        tempElem.buttons.classList.add('entry-buttons', 'push-right');

        tempElem.buttons.edit = document.createElement('i');
        tempElem.buttons.edit.innerText = 'edit';
        tempElem.buttons.edit.classList.add('material-icons', 'icon-btn-flat', 'tiny');
        tempElem.buttons.edit.addEventListener('click', this.#openEditStationModal.bind(this));
        tempElem.buttons.appendChild(tempElem.buttons.edit);

        tempElem.buttons.delete = document.createElement('i');
        tempElem.buttons.delete.innerText = 'delete';
        tempElem.buttons.delete.classList.add('material-icons', 'icon-btn-flat' , 'tiny');
        tempElem.buttons.delete.addEventListener('click', this.#handleStationDelete.bind(this));
        tempElem.buttons.appendChild(tempElem.buttons.delete);

        tempElem.appendChild(tempElem.rstElem);
        tempElem.appendChild(tempElem.dataElem);
        tempElem.appendChild(tempElem.buttons);

        if (mode === 'append') 
            STATION_TOOLBOX_LIST.appendChild(tempElem);
        if (mode === 'replace') 
            this.elem.replaceWith(tempElem);

        return tempElem;
    }

    #constructNote() {
        let tempNote = document.createElement('div');
        tempNote.setAttribute('id', 'note');
        tempNote.setAttribute('class', 'note');
        
        tempNote.header = document.createElement('div');
        tempNote.appendChild(tempNote.header);

        tempNote.header.headerTitle = document.createElement('span');
        tempNote.header.headerTitle.innerText = (this.station.name + ' - Notes');
        tempNote.header.appendChild(tempNote.header.headerTitle);

        tempNote.header.closeBtn = document.createElement('span');
        tempNote.header.closeBtn.setAttribute('class', 'close push-right');
        tempNote.header.closeBtn.innerText = '✖';
        tempNote.header.closeBtn.addEventListener('click', this.#handleNoteClose.bind(this));
        tempNote.header.appendChild(tempNote.header.closeBtn);

        tempNote.divider = document.createElement('div');
        tempNote.divider.setAttribute('class', 'divider');
        tempNote.appendChild(tempNote.divider);

        tempNote.noteContent = document.createElement('p');
        tempNote.noteContent.innerText = this.station.notes;
        tempNote.appendChild(tempNote.noteContent);

        return tempNote;
    }

    #formatInfo() {
        let info = this.station.type;

        if (this.station.useBusDisplay)
            info += ' | display on';
        else
            info += ' | display off';

        info += ' <span>| <a class="notes-btn">notes</a></span>';

        return info
    }

    #handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.oid);
        e.dataTransfer.dropEffect = "none";

        let ghost = e.target.cloneNode(true);
        ghost.id = (ghost.id + '-ghost');
        document.body.appendChild(ghost);
        ghost.style.transform = 'translate(-500%, -500%)';

        let xOffset = (ghost.clientWidth / 2);
        let yOffset = (ghost.clientHeight / 2);

        e.dataTransfer.setDragImage(ghost, xOffset, yOffset);

        RSTbuilder.currRST.elem.appendChild(RSTbuilder.endPlaceHolder);

        RSTbuilder.placeholderSwitch.set(true);
    }

    #handleDragEnd(e) {
        document.body.removeChild(document.getElementById((e.target.id + '-ghost')))

        RSTbuilder.placeholderSwitch.set(false);
        RSTbuilder.lastTriggeredDragOver.set(null);
        RSTbuilder.entryCounter.set(0);
        RSTbuilder.elem.set(null);

        RSTbuilder.endPlaceHolder.remove();
    }

    #handleNoteOpen() {
        let currNote = document.getElementById('note');

        if (currNote) currNote.remove();

        document.body.appendChild(this.noteElem);
    }

    #handleNoteClose() {
        this.noteElem.remove();
    }

    static openNewStationModal() {
        const STATION_MODAL = Modal.getModal('station_modal');

        STATION_MODAL_ELEM.querySelector('.modal-header h1').innerText = 'Add New Station';
        STATION_MODAL_ELEM.querySelector('#station_modal_submit').innerText = 'ADD';

        STATION_MODAL_ELEM.querySelector('#station_modal_submit').addEventListener(
            'click',
            StationToolboxEntry.handleStationSubmit
        );
        STATION_MODAL_ELEM.querySelector('#station_modal_cancel').addEventListener(
            'click',
            StationToolboxEntry.handleNewStationCancel,
        );

        STATION_MODAL.open();
    }

    static handleStationSubmit() {
        const STATION_FORM = document.forms['station_form'];
        const STATION_MODAL = Modal.getModal('station_modal');

        let formData = new FormData(STATION_FORM);

        if (StationToolboxEntry.validateStationform()) {
            const params = {
                id: Math.random(), //needs to be given from backend on save
                name: formData.get('station_name'),
                color: formData.get('station_color'),
                type: formData.get('station_type'),
                icon: (formData.get('station_type') + '_icon'),
                address: RSTMap.stationMapData.getAddress(),
                lat: RSTMap.stationMapData.getLatLng().lat,
                lng: RSTMap.stationMapData.getLatLng().lng,
                busDisplay: STATION_FORM.elements['station_bus_display'].checked,
                notes: formData.get('station_notes')
            }

            let tempStation = Station.addStation(params, true);
            addToolboxEntry(tempStation);
            RSTMap.stationMapData.resetAddressSearch();

            STATION_MODAL_ELEM.querySelector('#station_modal_submit').removeEventListener(
                'click',
                StationToolboxEntry.handleStationSubmit
            );
            STATION_MODAL_ELEM.querySelector('#station_modal_cancel').removeEventListener(
                'click',
                StationToolboxEntry.handleNewStationCancel
            );
            STATION_FORM.reset();
            STATION_MODAL.close();
        }
    }

    #openEditStationModal() {
        const STATION_MODAL = Modal.getModal('station_modal');
        const STATION_FORM = document.forms['station_form'];

        STATION_MODAL_ELEM.querySelector('.modal-header h1').innerText = 'Edit Station';
        STATION_MODAL_ELEM.querySelector('#station_modal_submit').innerText = 'UPDATE';

        STATION_FORM.elements['station_name'].value = this.station.name;
        STATION_FORM.elements['station_color'].value = this.station.color.name;
        STATION_FORM.elements['station_type'].value = this.station.type;
        STATION_FORM.elements['station_bus_display'].checked = this.station.useBusDisplay;
        STATION_FORM.elements['station_notes'].value = this.station.notes;
        RSTMap.stationMapData.setAddressSearch(this.station.address, { lat: this.station.lat, lng: this.station.lng });


        STATION_MODAL_ELEM.querySelector('#station_modal_submit').addEventListener(
            'click',
            this.bindedUpdateEvent
        );
        STATION_MODAL_ELEM.querySelector('#station_modal_cancel').addEventListener(
            'click',
            this.bindedStationCancel
        );

        STATION_MODAL.open();
    }

    #handleStationUpdate() {
        const STATION_FORM = document.forms['station_form'];
        const STATION_MODAL = Modal.getModal('station_modal');

        let formData = new FormData(STATION_FORM);

        if (StationToolboxEntry.validateStationform()) {
            const newParams = {
                name: formData.get('station_name'),
                color: formData.get('station_color'),
                type: formData.get('station_type'),
                icon: (formData.get('station_type') + '_icon'),
                address: RSTMap.stationMapData.getAddress(),
                lat: RSTMap.stationMapData.getLatLng().lat,
                lng: RSTMap.stationMapData.getLatLng().lng,
                busDisplay: STATION_FORM.elements['station_bus_display'].checked,
                notes: formData.get('station_notes')
            }

            this.station.update(newParams);
            this.update();
            RSTMap.stationMapData.resetAddressSearch();

            STATION_MODAL_ELEM.querySelector('#station_modal_submit').removeEventListener(
                'click', 
                this.bindedUpdateEvent
            );
            STATION_MODAL_ELEM.querySelector('#station_modal_cancel').removeEventListener(
                'click', 
                this.bindedCancelEvent
            );

            STATION_FORM.reset();
            STATION_MODAL.close();
        }
    }

    #handleStationDelete() {
        const CONFIRMATION_MODAL = Modal.getModal('confirmation_modal');
        MSG_ELEM.innerText = 'Delete Station: ' + this.station.name + '?';

        CONFIRM_BTN.addEventListener(
            'click',
            this.bindedDeleteConfirm
        );

        REJECT_BTN.addEventListener(
            'click',
            this.bindedDeleteReject
        )

        CONFIRMATION_MODAL.open();
    }

    #handleDeleteConfirm() {
        this.station.destroy();

        CONFIRM_BTN.removeEventListener(
            'click',
            this.bindedDeleteConfirm
        );
    }

    #handleDeleteCancel() {
        CONFIRM_BTN.removeEventListener(
            'click',
            this.bindedDeleteConfirm
        );

        REJECT_BTN.removeEventListener(
            'click',
            this.bindedDeleteReject
        )
    }

    #handleStationCancel() {
        const STATION_FORM = document.forms['station_form'];

        [...STATION_FORM.elements].forEach(element => {
            element.parentElement.classList.remove('invalid');
        });
        STATION_MODAL_ELEM.querySelector('#location_picker p:first-of-type').classList.remove('invalid');

        RSTMap.stationMapData.resetAddressSearch();

        STATION_MODAL_ELEM.querySelector('#station_modal_submit').removeEventListener(
            'click',
            this.bindedUpdateEvent
        );
        STATION_MODAL_ELEM.querySelector('#station_modal_cancel').removeEventListener(
            'click',
            this.bindedStationCancel
        );

        STATION_FORM.reset();
    }

    static handleNewStationCancel() {
        const STATION_FORM = document.forms['station_form'];

        [...STATION_FORM.elements].forEach(element => {
            element.parentElement.classList.remove('invalid');
        });
        STATION_MODAL_ELEM.querySelector('#location_picker p:first-of-type').classList.remove('invalid');

        RSTMap.stationMapData.resetAddressSearch();

        STATION_MODAL_ELEM.querySelector('#station_modal_submit').removeEventListener(
            'click',
            StationToolboxEntry.handleStationSubmit
        );
        STATION_MODAL_ELEM.querySelector('#station_modal_cancel').removeEventListener(
            'click',
            StationToolboxEntry.handleNewStationCancel
        );

        STATION_FORM.reset();
    }

    static validateStationform() {
        const STATION_FORM = document.forms['station_form'];
        let allValid = true;

        if (!STATION_FORM.elements['station_name'].value) {
            STATION_FORM.elements['station_name'].parentElement.classList.add('invalid');
            allValid = false;
        }
        else {
            STATION_FORM.elements['station_name'].parentElement.classList.remove('invalid');
        }

        let mapTitle = STATION_MODAL_ELEM.querySelector('#location_picker p:first-of-type');
        if (!RSTMap.stationMapData.isValid) {
            mapTitle.classList.add('invalid');
            allValid = false;
        }
        else {
            mapTitle.classList.remove('invalid');
        }

        return allValid;
    }
}

export { initToolbox, addToolboxEntry, updateToolboxEntry, removeToolboxEntry, clearToolboxEntries };