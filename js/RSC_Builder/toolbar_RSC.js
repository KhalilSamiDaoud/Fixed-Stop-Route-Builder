import * as RouteMap from './routeMap.js';

const TB_NAME = document.getElementById('tb_rst_name');
const TB_DROP_DOWN = document.getElementById('tb_rsc_dd');
const TB_START_TIME = document.getElementById('tb_start_time');
const TB_END_TIME = document.getElementById('tb_end_time');
const TB_HEADWAY = document.getElementById('tb_headway');
const TB_VEHICLES = document.getElementById('tb_vehicles');
const TB_DOTW = document.getElementById('tb_dotw');
const TB_ITERATIONS = document.getElementById('tb_iterations');
const TB_ITERATION_TIME = document.getElementById('tb_iteration_time');

TB_DROP_DOWN.addEventListener('change', handleOptionSelect);

let currRSC, currRoute;

function setToolBarData(route) {
    if (route.rscs.size === 0) {
        setEmptyToolBarData(route);
        return;
    }

    currRoute = route;
    currRSC = [...route.rscs.values()][0];

    while (TB_DROP_DOWN.firstChild)
        TB_DROP_DOWN.removeChild(TB_DROP_DOWN.firstChild);

    route.rscs.forEach( rsc => {
        let tempElem = document.createElement('option');
        tempElem.setAttribute('value', rsc.id);
        tempElem.innerText = rsc.name;

        TB_DROP_DOWN.appendChild(tempElem);
    });

    setDOTW();
    TB_NAME.innerText = route.name;
    TB_NAME.setAttribute('class', route.color.name);
    TB_START_TIME.innerText = currRSC.startTime.twelveHour;
    TB_END_TIME.innerText = currRSC.endTime.twelveHour;
    TB_HEADWAY.innerText = currRSC.headway + 'min';
    TB_VEHICLES.innerText= currRSC.vehicles;
    TB_ITERATIONS.innerText = currRSC.iterations;
    TB_ITERATION_TIME.innerText = currRSC.iterationTime + 'min';
}

function setEmptyToolBarData(route) {
    currRoute = route;
    currRSC = null;

    TB_NAME.innerText = route.name;
    TB_NAME.setAttribute('class', route.color.name);

    while (TB_DROP_DOWN.firstChild)
        TB_DROP_DOWN.removeChild(TB_DROP_DOWN.firstChild);

    clearDOTW();

    TB_START_TIME.innerText = '--:-- --';
    TB_END_TIME.innerText = '--:-- --';
    TB_HEADWAY.innerText = '--';
    TB_VEHICLES.innerText = '--';
    TB_ITERATIONS.innerText = '--';
    TB_ITERATION_TIME.innerText = '--';
}

function updateRouteData(route) {
    if (route !== currRoute) return;

    TB_NAME.innerText = route.name;
    TB_NAME.setAttribute('class', route.color.name);
}

function addRSCdata(rsc) {
    if (rsc.ownerRoute !== currRoute) return;

    let tempElem = document.createElement('option');
    tempElem.setAttribute('value', rsc.id);
    tempElem.innerText = rsc.name;

    TB_DROP_DOWN.appendChild(tempElem);

    if (TB_DROP_DOWN.children.length === 1) {
        TB_DROP_DOWN.value = TB_DROP_DOWN.firstChild.value;
        TB_DROP_DOWN.dispatchEvent(new Event('change'));
    }
}

function updateRSCdata(rsc) {
    if (rsc.ownerRoute !== currRoute) return;
    if (rsc !== currRSC) return;

    setDOTW();
    TB_START_TIME.innerText = currRSC.startTime.twelveHour;
    TB_END_TIME.innerText = currRSC.endTime.twelveHour;
    TB_HEADWAY.innerText = currRSC.headway + 'min';
    TB_VEHICLES.innerText = currRSC.vehicles;
    TB_ITERATIONS.innerText = currRSC.iterations;
    TB_ITERATION_TIME.innerText = currRSC.iterationTime + 'min';
}

function removeRSCdata(rsc) {
    if (rsc.ownerRoute !== currRoute) return;

    let targetEntry = TB_DROP_DOWN.querySelector('[value="' + rsc.id + '"]');
    TB_DROP_DOWN.removeChild(targetEntry);

    if (rsc === currRSC) {
        if (!TB_DROP_DOWN.firstChild)
            setEmptyToolBarData(rsc.ownerRoute)
        else {
            TB_DROP_DOWN.value = TB_DROP_DOWN.firstChild.value;
            TB_DROP_DOWN.dispatchEvent(new Event('change'));
        }
    }
}

function clearToolBarData() {
    currRSC = null;
    currRoute = null;

    while (TB_DROP_DOWN.firstChild)
        TB_DROP_DOWN.removeChild(TB_DROP_DOWN.firstChild);

    clearDOTW();

    TB_NAME.innerText = 'N/A';
    TB_NAME.removeAttribute('class');
    TB_START_TIME.innerText = '--:-- --';
    TB_END_TIME.innerText = '--:-- --';
    TB_HEADWAY.innerText = '--';
    TB_VEHICLES.innerText = '--';
    TB_ITERATIONS.innerText = '--';
    TB_ITERATION_TIME.innerText = '--';
}

function setDOTW() {
    let DOTW = TB_DOTW.querySelectorAll('input');

    DOTW.forEach( elem => {
        elem.removeAttribute('checked');
    });

    currRSC.appliedDays.array.forEach(day => {
        switch (day) {
            case 'M':
                DOTW[0].setAttribute('checked', '');
                break;
            case 'T':
                DOTW[1].setAttribute('checked', '');
                break;
            case 'W':
                DOTW[2].setAttribute('checked', '');
                break;
            case 'R':
                DOTW[3].setAttribute('checked', '');
                break;
            case 'F':
                DOTW[4].setAttribute('checked', '');
                break;
            case 'S':
                DOTW[5].setAttribute('checked', '');
                break;
            case 'U':
                DOTW[6].setAttribute('checked', '');
                break;
            default:
                console.warn('INVALID DOTW SET IN RSC ' + currRSC.id);
        }
    });
}

function clearDOTW() {
    let DOTW = TB_DOTW.querySelectorAll('input');

    DOTW.forEach( day => {
        day.removeAttribute('checked');
    });
}

function handleOptionSelect(e) {
    currRSC = currRoute.rscs.get(+e.target.value);

    setDOTW();
    TB_START_TIME.innerText = currRSC.startTime.twelveHour;
    TB_END_TIME.innerText = currRSC.endTime.twelveHour;
    TB_HEADWAY.innerText = currRSC.headway + 'min';
    TB_VEHICLES.innerText = currRSC.vehicles;
    TB_ITERATIONS.innerText = currRSC.iterations;
    TB_ITERATION_TIME.innerText = currRSC.iterationTime + 'min';

    RouteMap.getMapRoute(currRSC.ownerRoute.id).hideRSC();
    RouteMap.getMapRoute(currRSC.ownerRoute.id).setRSC(currRSC);
}

export { setToolBarData, clearToolBarData, updateRouteData, addRSCdata, updateRSCdata, removeRSCdata };