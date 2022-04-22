import * as Utils from '../utils.js';
import * as APIoutput from './testOutput.js'; //replace with real API script

const stations = new Map();

function initStations(stationList) {
    stationList.forEach(entry => {
        addStation(entry);
    });
}

function addStation(params, isNew=false) {
    stations.set(params.id, new Station(params, isNew));

    return stations.get(params.id);
}

function updateStation(params) {
    stations.get(params.id).update(params);
}

function removeStation(stationID) {
    if (!stations.delete(stationID))
        consol.warn('removeStaion: station ' + stationID + 'does not exist');
}

function getStations() {
    return stations;
}

function getStation(stationID) {
    return stations.get(stationID);
}

function clearStations() {
    stations.forEach(station => {
        station.destroy();
    });

    stations.clear();
}

class Station {
    constructor(params, isNew) {
        this.id = params.id;
        this.name = params.name;
        this.icon = params.icon;
        this.type = params.type;
        this.color = {
            name: params.color,
            hex: Utils.resolveColor(params.color)
        }
        this.lat = params.lat;
        this.lng = params.lng;
        this.address = params.address;
        this.useBusDisplay = params.busDisplay;
        this.notes = params.notes;

        this.styleClasses = this.#getStyleClasses();
        this.elem = this.#constructElem();
        this.modified = isNew;

        if (isNew) APIoutput.enableSaveBtn();
    }

    update(newParams) {
        this.name = newParams.name;
        this.icon = newParams.icon;
        this.type = newParams.type;
        this.color = {
            name: newParams.color,
            hex: Utils.resolveColor(newParams.color)
        }
        this.lat = newParams.lat;
        this.lng = newParams.lng;
        this.address = newParams.address;
        this.useBusDisplay = newParams.busDisplay;
        this.notes = newParams.notes;

        this.styleClasses = this.#getStyleClasses();
        this.elem = this.#constructElem();

        this.modified = true;
        this.isMarkedDeleted = false;
        APIoutput.enableSaveBtn();
    }

    destroy() {
        this.isMarkedDeleted = true;
        APIoutput.enableSaveBtn();
    }

    toJSON() {
        let tempJSON = {
            id: +this.id,
            name: this.name,
            color: this.color.name,
            icon: this.icon,
            type: this.type,
            lat: +this.lat,
            lng: +this.lng,
            address: this.address,
            busDisplay: this.useBusDisplay,
            notes: this.notes,
            markedDeleted: this.isMarkedDeleted
        };

        return tempJSON;
    }

    #constructElem() {
        let elem = document.createElement('div');
        elem.classList.add(this.styleClasses.container, (this.color.name + '-outline'));

        elem.icon = document.createElement('i');
        elem.icon.innerText = this.styleClasses.icon;
        elem.icon.classList.add('material-icons');

        elem.appendChild(elem.icon);

        return elem;
    }

    #getStyleClasses() {
        let styleClasses = {
            container: null,
            icon: null,
            typeColor: null
        };

        if (this.type === 'requested' || this.type === 'virtual') {
            styleClasses.container = 'diamond-container';
            styleClasses.typeColor = 'orange-text';
        }
        else {
            styleClasses.container = 'circle-container';
            styleClasses.typeColor = 'blue-text';
        }
        
        switch(this.icon) {
            case('station_icon'):
                styleClasses.icon = 'directions_bus';
                break;
            case('virtual_icon'):
                styleClasses.icon = 'sensors';
                break;
            case('hub_icon'):
                styleClasses.icon = 'domain';
                break;
            case('request_icon'):
                styleClasses.icon = 'record_voice_over';
                break;
            default:
                styleClasses.icon = 'directions_bus';
                break;
        }

        return styleClasses;
    }
}

export { initStations, addStation, getStations, getStation, removeStation, updateStation, clearStations };