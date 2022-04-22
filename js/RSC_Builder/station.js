import * as Utils from '../utils.js';

const stations = new Map();

function initStations(stationList) {
    stationList.forEach(entry => {
        addStation(entry);
    });
}

function addStation(params) {
    stations.set(params.id, new Station(params));
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
    constructor(params) {
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
        this.useBusDisplay = params.useBusDisplay;
        this.notes = params.notes;
    }

    update() {
        //fill
    }

    destroy() {
        //fill
    }
}

export { initStations, addStation, getStations, getStation, removeStation, updateStation, clearStations };