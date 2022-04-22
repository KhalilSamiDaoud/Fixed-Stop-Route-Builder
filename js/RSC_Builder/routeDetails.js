import * as Route from './route.js';
import * as Utils from '../utils.js'
import * as Station from './station.js';
import * as Modal from '../modal.js';
import * as Config from '../configuration.js';
import * as RouteBuilder from './routeBuilder.js';
import * as APIoutput from './testOutput.js' //replace with real api script

if (!document.getElementById('routeDetails_css')) { Config.loadStyleSheet('routeDetails'); }

const EXPAND_DETAILS_BTN = document.getElementById('expand_route_details');
const BUILD_TABLE_BTN = document.getElementById('build_route_table');
const ROUTE_DETAILS_SELECT = document.getElementById('select_table_dd');
const STOP_TABLE = document.getElementById('stop_table');
const RST_TABLE = document.getElementById('rst_table');
const REBUILD_CONFIRM = document.getElementById('rebuild_confirm');
const REBUILD_REJECT = document.getElementById('rebuild_reject');

const NO_SELECTED_ROUTE_ELEM = document.createElement('div');
NO_SELECTED_ROUTE_ELEM.id = 'no-route-selected';
NO_SELECTED_ROUTE_ELEM.classList.add('no-table');
NO_SELECTED_ROUTE_ELEM.innerHTML = '<span>No Route Selected 🚍</span>'

const routeStopTables = new Map(); //key: route.id, value: RouteStopTableEntry 

let currDetailedRoute = null;

RST_TABLE.style.display = 'none';

EXPAND_DETAILS_BTN.addEventListener('click', handlePanelToggle);
ROUTE_DETAILS_SELECT.addEventListener('change', handleTableSelect);

function initRouteDetails() {
    STOP_TABLE.appendChild(NO_SELECTED_ROUTE_ELEM);

    Route.getRoutes().forEach( route => {
        routeStopTables.set(route.id, new RouteStopTableEntry(route));
    });
}

function addRouteDetails(route) {
    routeStopTables.set(route.id, new RouteStopTableEntry(route));
}

function getAllRouteDetails() {
    return routeStopTables;
}

function getRouteDetails(routeID) {
    return routeStopTables.get(routeID);
}

function handlePanelToggle() {
    let elem = document.getElementById('route_details');
    let collapseClass = 'collapsed';

    EXPAND_DETAILS_BTN.innerText = (EXPAND_DETAILS_BTN.innerText === 'expand_less') ? 'expand_more' : 'expand_less';

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

function handleTableSelect(e) {
    switch (e.target.value) {
        case 'rst':
            STOP_VIEW_TABLE.style.display = 'none';
            RST_VIEW_TABLE.style.display = 'block';
            break;
        case 'stop':
            STOP_VIEW_TABLE.style.display = 'block';
            RST_VIEW_TABLE.style.display = 'none';
            break;
    }
}

function enableBuildBtn() {
    BUILD_TABLE_BTN.classList.remove('disabled');

    BUILD_TABLE_BTN.addEventListener('click', handleRouteBuildClick);
}

function disableBuildBtn() {
    BUILD_TABLE_BTN.classList.add('disabled');

    BUILD_TABLE_BTN.removeEventListener('click', handleRouteBuildClick);
}

function handleRouteBuildClick() {
    let tempRouteDetails = getRouteDetails(RouteBuilder.currSortable.route.id);

    tempRouteDetails.handleRebuild();
}

class RouteStopTableEntry {
    constructor(route) {
        this.route = route;
        this.hasTable = false;

        if (this.route.stopSequence?.length === 0 || !this.route.stopSequence)
            this.#constructEmpty();
        else {
            this.#constructBlockSelect();
            this.#constructTable();
            this.hasTable = true;
        }
    }

    update() {
        //fill
    }

    destroy() {
        //fill
    }

    setDetails() {
        if (currDetailedRoute === this) return;

        if (currDetailedRoute)
            currDetailedRoute.hideDetails();
        else
            NO_SELECTED_ROUTE_ELEM.remove();

        STOP_TABLE.appendChild(this.tableElem);
        currDetailedRoute = this;
    }

    hideDetails() {
        STOP_TABLE.removeChild(this.tableElem);
        currDetailedRoute = null;
    }

    #constructTable() {
        this.tableElem = document.createElement('table');
        
        this.tableElem.tableHead = document.createElement('thead');
        this.tableElem.tableHead.appendChild(document.createElement('tr'));

        let placeholder = document.createElement('th')
        this.tableElem.tableHead.firstChild.appendChild(placeholder);

        this.route.stopSequence.forEach( stopID => {
            let tempStop = Station.getStation(stopID);

            let tempHeader = document.createElement('th');
            tempHeader.appendChild(document.createElement('span'));

            tempHeader.firstChild.title = (tempStop.address) ? tempStop.address : tempStop.name;
            tempHeader.firstChild.innerText = (tempStop.address) ? tempStop.address : tempStop.name;

            this.tableElem.tableHead.firstChild.appendChild(tempHeader);
        });

        this.tableElem.tableBody = document.createElement('tbody');
        this.tableElem.tableBody.classList.add('hidden-scrollbar-primary');

        let rowLength = this.route.stopSequence.length;
        let currLength = 0;

        this.route.trips.forEach( trip => {
            let tempRow = document.createElement('tr');
            tempRow.appendChild(document.createElement('th'));
            tempRow.firstChild.appendChild(this.blockSelectElem.cloneNode(true));
            tempRow.firstChild.firstChild.value = trip.blockName;
            tempRow.firstChild.firstChild.addEventListener('change', this.#handleStopTableValueChange.bind(this));

            trip.segments.forEach( segment => {
                segment.stops.forEach( stop => {
                    let tempCell = document.createElement('td');
                    tempCell.setAttribute('data-segment', segment.segmentName);
                    tempCell.appendChild(document.createElement('input'));
                    tempCell.firstChild.setAttribute('type', 'time');
                    tempCell.firstChild.setAttribute('value', stop.stopArrivalTime);
                    tempCell.firstChild.addEventListener('input', this.#handleStopTableValueChange.bind(this));

                    if(stop.exclude)
                        tempCell.classList.add('exclude');

                    tempCell.addEventListener('mousedown', this.#handleStopTableClick.bind(this));
                    tempCell.addEventListener('contextmenu', this.#handleStopTableRightClick);

                    tempRow.appendChild(tempCell);
                    currLength++;
                });
            });

            let remainingCells = (rowLength - currLength);

            if (remainingCells)
                for (let i = 0; i < remainingCells; i++) {
                    let tempCell = document.createElement('td');
                    tempCell.classList.add('filler');

                    tempRow.appendChild(tempCell);
                }

            this.tableElem.tableBody.appendChild(tempRow);
            currLength = 0;
        });

        this.tableElem.appendChild(this.tableElem.tableHead);
        this.tableElem.appendChild(this.tableElem.tableBody);
    }

    #buildNewTable() {
        this.tableElem = document.createElement('table');

        this.tableElem.tableHead = document.createElement('thead');
        this.tableElem.tableHead.appendChild(document.createElement('tr'));

        let placeholder = document.createElement('th')
        this.tableElem.tableHead.firstChild.appendChild(placeholder);

        this.route.stopSequence.forEach( stopID => {
            let tempStop = Station.getStation(stopID);

            let tempHeader = document.createElement('th');
            tempHeader.appendChild(document.createElement('span'));

            tempHeader.firstChild.title = (tempStop.address) ? tempStop.address : tempStop.name;
            tempHeader.firstChild.innerText = (tempStop.address) ? tempStop.address : tempStop.name;

            this.tableElem.tableHead.firstChild.appendChild(tempHeader);
        });

        this.tableElem.tableBody = document.createElement('tbody');
        this.tableElem.tableBody.classList.add('hidden-scrollbar-primary');

        let sortedRSCs = [...this.route.rscs.values()].sort((a, b) => {
            return Utils.parseTime(a.startTime.twelveHour) - Utils.parseTime(b.startTime.twelveHour);
        });
        let rowLength = this.route.stopSequence.length;
        let currLength = 0;
        let blockCount = 1;

        sortedRSCs.forEach( rsc => {
            for (let i = 0; i < rsc.iterations; i++) {
                blockCount = 1;
                for(let j = 0; j < rsc.vehicles; j++) {
                    let tempRow = document.createElement('tr');
                    tempRow.appendChild(document.createElement('th'));
                    tempRow.firstChild.appendChild(this.blockSelectElem.cloneNode(true));
                    tempRow.firstChild.firstChild.value = ('Block #' + blockCount);
                    tempRow.firstChild.firstChild.addEventListener('change', this.#handleStopTableValueChange.bind(this));


                    let baseTime = (Utils.parseTime(rsc.startTime.twelveHour) + (rsc.iterationTime * i) + (rsc.headway * j));
                    let prevRST = null;

                    rsc.rsts.forEach(rst => {
                        let RSTstartOffset = Utils.findSubArray(this.route.stopSequence, rst.stopSequence);

                        if (currLength < RSTstartOffset)
                            for (let i = 0; i < RSTstartOffset; i++) {
                                let tempCell = document.createElement('td');
                                tempCell.classList.add('filler');
                                tempRow.appendChild(tempCell);
                                currLength++;
                            }

                        rst.stations.forEach(station => {
                            let stationOffsetTime = (baseTime + Utils.parseTime(station.arrivalTime) + rst.minStartLayover);
                            if (prevRST) stationOffsetTime += prevRST.minEndLayover;

                            let tempCell = document.createElement('td');
                            tempCell.setAttribute('data-segment', rst.name);
                            tempCell.appendChild(document.createElement('input'));
                            tempCell.firstChild.setAttribute('type', 'time');
                            tempCell.firstChild.setAttribute('value', Utils.convertTime12to24(Utils.timeToString(stationOffsetTime)));
                            tempCell.firstChild.addEventListener('input', this.#handleStopTableValueChange.bind(this));

                            tempCell.addEventListener('mousedown', this.#handleStopTableClick.bind(this));
                            tempCell.addEventListener('contextmenu', this.#handleStopTableRightClick);

                            tempRow.appendChild(tempCell);
                            currLength++;
                        });
                        prevRST = rst;
                        baseTime += rst.runTime;
                    });

                    let remainingCells = (rowLength - currLength);

                    if (remainingCells) {
                        for (let i = 0; i < remainingCells; i++) {
                            let tempCell = document.createElement('td');
                            tempCell.classList.add('filler');

                            tempRow.appendChild(tempCell);
                        }
                    }

                    this.tableElem.tableBody.appendChild(tempRow);
                    currLength = 0;

                    blockCount++;
                }
            }
        });

        this.tableElem.appendChild(this.tableElem.tableHead);
        this.tableElem.appendChild(this.tableElem.tableBody);

        this.route.modified = true;
        APIoutput.enableSaveBtn();
    }

    #constructEmpty() {
        this.tableElem = document.createElement('div');
        this.tableElem.classList.add('no-table')

        this.tableElem.emptyMsg = document.createElement('span');
        this.tableElem.emptyMsg.innerText = 'No Table was Consructed 🛠️';

        this.tableElem.appendChild(this.tableElem.emptyMsg);
    }

    #constructBlockSelect() {
        this.blockSelectElem = document.createElement('select');

        let vehicleSum = 0;

        this.route.rscs.forEach(rsc => { 
            vehicleSum = (rsc.vehicles > vehicleSum) ? rsc.vehicles : vehicleSum; 
        });

        for (let i=1; i <= vehicleSum; i++ ) {
            let tempOption = document.createElement('option');
            tempOption.value = ('Block #' + i);
            tempOption.innerText = ('Block #' + i);

            this.blockSelectElem.appendChild(tempOption);
        }
    }

    #handleStopTableClick(e) {
        e = e || window.event;
        switch (e.which) {
            case 1:
                break;
            case 3:
                e.currentTarget.firstChild.disabled = (e.currentTarget.firstChild.disabled) ? false : true;
                e.currentTarget.classList.toggle('exclude');
                this.route.modified = true;
                APIoutput.enableSaveBtn();
                break;
        }

        if (e.currentTarget.classList.contains('exclude')) return;
    }

    #handleStopTableValueChange() {
        this.route.modified = true;
        APIoutput.enableSaveBtn();
    }

    static bindedRouteDetails = null;
    bindedRebuildConfirmEvent = this.#handleRebuildConfirm.bind(this);
    bindedRebuildRejectEvent = this.#handleRebuildReject.bind(this);

    #handleStopTableRightClick(e) {
        e.preventDefault();
    }

    handleRebuild() {
        if (this.route.rscs.size === 0) return;

        if (this.hasTable) {
            const REBUILD_MODAL = Modal.getModal('rebuild_modal');

            REBUILD_CONFIRM.addEventListener('click', this.bindedRebuildConfirmEvent);
            REBUILD_REJECT.addEventListener('click', this.bindedRebuildRejectEvent);
            RouteStopTableEntry.bindedRouteDetails = this;

            REBUILD_MODAL.open();
        }
        else {
            this.#constructBlockSelect();
            this.#buildNewTable();
            STOP_TABLE.replaceChild(this.tableElem, STOP_TABLE.firstElementChild);
            this.hasTable = true;
        }
    }

    #handleRebuildConfirm() {
        RouteStopTableEntry.bindedRouteDetails.#constructBlockSelect();
        RouteStopTableEntry.bindedRouteDetails.#buildNewTable();
        STOP_TABLE.replaceChild(RouteStopTableEntry.bindedRouteDetails.tableElem, STOP_TABLE.firstElementChild);

        REBUILD_CONFIRM.removeEventListener('click', RouteStopTableEntry.bindedRouteDetails.bindedRebuildConfirmEvent);
        REBUILD_REJECT.removeEventListener('click', RouteStopTableEntry.bindedRouteDetails.bindedRebuildRejectEvent);

        RouteStopTableEntry.bindedRouteDetails = null;
    }

    #handleRebuildReject() {
        REBUILD_CONFIRM.removeEventListener('click', RouteStopTableEntry.bindedRouteDetails.bindedRebuildConfirmEvent);
        REBUILD_REJECT.removeEventListener('click', RouteStopTableEntry.bindedRouteDetails.bindedRebuildRejectEvent);

        RouteStopTableEntry.bindedRouteDetails = null;
    }
}

export { initRouteDetails, getAllRouteDetails, addRouteDetails, getRouteDetails, enableBuildBtn, disableBuildBtn };