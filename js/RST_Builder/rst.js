import * as Utils from '../utils.js';
import * as RSTBuilder from './rstBuilder.js';
import * as APIoutput from './testOutput.js' //replace with real api script (APIoutput.js)

const rsts = new Map();

function initRSTs(RSTlist) {
    RSTlist.forEach(entry => {
        addRST(entry);
    });
}

function addRST(params, isNew=false) {
    rsts.set(params.id, new RST(params, isNew));

    return rsts.get(params.id);
}

function updateRST(params) {
    rsts.get(params.id).update(params);
}

function removeRST(id) {
    if (!rsts.delete(id))
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
    constructor(params, isNew) {
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
        this.minStartLayover = +params.minStartLayover;
        this.minEndLayover = +params.minEndLayover;
        this.runTime = +params.runTime;
        this.cycleTime = +params.cycleTime;

        //To allow repeats, stations are a sequential list of objects containing a stop id, and stop data
        this.stations = [];
        params.stations.forEach(stopEntry => {
            this.stations.push(stopEntry);
        });

        this.#updateSequence();
        this.modified = isNew;

        if (isNew) APIoutput.enableSaveBtn();
    }

    update(newParams) {
        this.name = newParams.name;
        this.minStartLayover = +newParams.minStartLayover;
        this.minEndLayover = +newParams.minEndLayover;
        this.color = {
            name: newParams.color,
            hex: Utils.resolveColor(newParams.color)
        };
        this.appliedDays = {
            array: newParams.appliedDays,
            string: newParams.appliedDays.join(', ')
        };
        this.cycleTime = (this.runTime + this.minStartLayover + this.minEndLayover);

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
            stations: this.stations,
            minStartLayover: +this.minStartLayover,
            minEndLayover: +this.minEndLayover,
            runTime: +this.runTime,
            cycleTime: +this.cycleTime,
            appliedDays: this.appliedDays.array,
            markedDeleted: this.isMarkedDeleted
        };

        return tempJSON;
    }

    updateStations(builderElem) {
        if (builderElem.children.length === 0) {
            this.#setNoStations(); 
            return;
        }

        this.stations = [];
        let newStation = {};
        let queryStringArrival = '.stop-data > div > input:first-of-type';
        let queryStringDeparture = '.stop-data > div > input:last-of-type';
        let firstStart = Utils.parseTime(builderElem.firstChild.querySelector(queryStringArrival).value);
        let lastEnd = Utils.parseTime(builderElem.lastChild.querySelector(queryStringDeparture).value);

        [...builderElem.children].forEach( node => {
            if (!node.classList.contains('waypoint-entry')) {

                let tempWayPoints = [];
                let target = node.previousElementSibling;
                while (target?.classList.contains('waypoint-entry')) {
                    tempWayPoints.push({
                        lat: +target.dataset.lat, 
                        lng: +target.dataset.lng,
                        driveTime: 0,
                        driveDistance: 0
                    });

                    target = target.previousElementSibling;
                }

                newStation = {
                    id: +node.dataset.oid,
                    driveTime: -1,
                    driveDistance: -1,
                    arrivalTime: node.querySelector(queryStringArrival).value,
                    departureTime: node.querySelector(queryStringDeparture).value,
                    wayPoints: tempWayPoints
                };

                this.stations.push(newStation);
            }
        });

        this.#updateSequence();
        this.runTime = (lastEnd - firstStart);
        this.cycleTime = (this.runTime + this.minStartLayover + this.minEndLayover);
        this.modified = true;
        APIoutput.enableSaveBtn();
    }

    addWayPoints(waypoints, index) {
        this.stations[index].wayPoints = [];

        waypoints.forEach( waypoint => {
            this.stations[index].wayPoints.push({
                lat: waypoint.lat,
                lng: waypoint.lng,
                driveTime: 1,
                driveDistance: 0.5
            });
        });

        RSTBuilder.getRSTbuilderEntry(this.id).setWaypointData(waypoints, index);
    }

    #setNoStations() {
        this.stations = [];
        this.#updateSequence();
        this.runTime = 0;
        this.cycleTime = (this.runTime + this.minStartLayover + this.minEndLayover);
        this.modified = true;
        APIoutput.enableSaveBtn();
    }

    #updateSequence() {
        this.stopSequence = this.stations.map(station => station.id);
        this.stopCount = this.stations.length;
    }
}

export { initRSTs, addRST, getRSTs, getRST, removeRST, updateRST, clearRSTs, RST };