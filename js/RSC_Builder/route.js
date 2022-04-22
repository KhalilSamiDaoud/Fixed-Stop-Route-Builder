import * as Utils from '../utils.js';
import * as RSC from './rsc.js';
import * as APIoutput from './testOutput.js' //replace with real api script 
import * as RouteDetails from './routeDetails.js';

const routes = new Map(); //key: route.id, val: route 

function initRoutes(RouteList) {
    RouteList.forEach(entry => {
        addRoute(entry);
    });
}

function addRoute(route, isNew=false) {
    routes.set(route.id, new Route(route, isNew));


    return routes.get(route.id);
}

function updateRoute(newParams) {
    if (!routes.get(newParams.id))
        addRoute(newParams, true);

    routes.get(newParams.id).update(newParams);
}

function removeRoute(route) {
    routes.get(route.id).destroy();
}

function getRoutes() {
    return routes;
}

function clearRoute() {
    routes.forEach(entry => {
        entry.destroy();
    });

    routes.clear();
}

class Route {
    constructor(params, isNew = false) {
        this.id = params.id;
        this.name = params.name;
        this.color = {
            name: params.color,
            hex: Utils.resolveColor(params.color)
        }
        this.stopSequence = params.stopSequence;
        this.trips = params.trips;

        this.rscs = new Map();
        params.rscs.forEach( rscID => {
            RSC.getRSC(rscID).ownerRoute = this;
            this.rscs.set(rscID, RSC.getRSC(rscID));
        });

        this.modified = isNew
        this.isMarkedDeleted = false;
    }

    update(newParams) {
        this.name = newParams.name;
        this.color.name = newParams.color;
        this.color.hex = Utils.resolveColor(newParams.color);

        this.rscs.clear();
        newParams.rscs.forEach( rscID => {
            RSC.getRSC(rscID).ownerRoute = this;
            this.rscs.set(rscID, RSC.getRSC(rscID));
        });

        this.updateStopSequence();
        
        this.modified = true;
        APIoutput.enableSaveBtn();
    }

    destroy() {
        this.isMarkedDeleted = true;
        APIoutput.enableSaveBtn();
    }

    toJSON() {
        let routeDetailsEntry = RouteDetails.getRouteDetails(this.id);
        let tripsArray = [];

        if (routeDetailsEntry.hasTable) {
            let tableElem = routeDetailsEntry.tableElem;

            for (let row of tableElem.rows) {
                if (!row.cells[0].firstChild) continue;

                let tempTrip = {
                    blockName: row.querySelector('th').firstElementChild.value,
                    segments: []
                };

                let currSegName = null;
                let currSegment = null;

                for (let cell of row.cells) {
                    if (cell?.firstElementChild?.nodeName === 'SELECT') continue;
                    if (cell.classList.contains('filler')) {
                        if (!cell.nextElementSibling) tempTrip.segments.push(currSegment);
                        continue;
                    };

                    if (cell.dataset.segment !== currSegName) {
                        if (currSegment) tempTrip.segments.push(currSegment);

                        currSegName = cell.dataset.segment;

                        currSegment = {
                            segmentName: currSegName,
                            stops: [
                                { 
                                    stopArrivalTime: cell.firstElementChild.value, 
                                    exclude: cell.classList.contains('exclude')
                                }
                            ]
                        };
                    }

                    else {
                        currSegment.stops.push(
                            {
                                stopArrivalTime: cell.firstElementChild.value,
                                exclude: cell.classList.contains('exclude')
                            }
                        );

                        if (!cell.nextElementSibling) tempTrip.segments.push(currSegment);
                    }
                }

                tripsArray.push(tempTrip);
            }
        }

        let tempJSON = {
            id: this.id,
            name: this.name,
            rscs: [...this.rscs.keys()],
            color: this.color.name,
            stopSequence: this.stopSequence,
            trips: tripsArray,
            markedDeleted: this.isMarkedDeleted
        };

        return tempJSON;
    }

    addOwnedRSC(rscID) {
        this.rscs.set(rscID, RSC.getRSC(rscID));
        this.rscs.get(rscID).ownerRoute = this;

        this.updateStopSequence();
    }

    //standardize input as string or num l8tr
    removeOwnedRSC(rscID) {
        this.rscs.get(+rscID).ownerRoute = null;
        this.rscs.delete(+rscID);

        this.updateStopSequence();
    }

    updateStopSequence() {
        let knownRSTs = [];
        let newSequence = [];

        this.rscs.forEach( rsc => {
            rsc.rsts.forEach( rst => {
                if (!knownRSTs.includes(rst.id)) {
                    knownRSTs.push(rst.id);

                    rst.stations.forEach(station => {
                        newSequence.push(station.id);
                    });
                }
            });
        });

        this.stopSequence = newSequence;
        
        if (APIoutput.isListening) {
            this.modified = true;
            APIoutput.enableSaveBtn();
        }
    }
}

export { initRoutes, addRoute, updateRoute, removeRoute, getRoutes, clearRoute };