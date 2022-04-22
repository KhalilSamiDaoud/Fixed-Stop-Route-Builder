const TB_NAME = document.getElementById('tb_rst_block');
const TB_DOTW = document.getElementById('tb_dotw');
const TB_START_LAYOVER = document.getElementById('tb_start_layover');
const TB_END_LAYOVER = document.getElementById('tb_end_layover');
const TB_RUNTIME = document.getElementById('tb_runtime');
const TB_CYCLETIME = document.getElementById('tb_cycletime');
const TB_STOPS = document.getElementById('tb_stops');

let currRST;

function setToolBarData(rst) {
    if (rst.stations.length === 0) {
        setEmptyToolBarData(rst);
        return;
    }

    currRST = rst;

    setDOTW();
    TB_NAME.setAttribute('class', 'rst-block ' + currRST.color.name);
    TB_NAME.firstElementChild.innerText = currRST.name;
    TB_START_LAYOVER.innerText = currRST.minStartLayover;
    TB_END_LAYOVER.innerText = currRST.minEndLayover;
    TB_RUNTIME.innerText = currRST.runTime + 'min';
    TB_CYCLETIME.innerText = currRST.cycleTime + 'min';
    TB_STOPS.innerText = currRST.stopCount;
}

function setEmptyToolBarData(rst) {
    currRST = rst;

    clearDOTW();
    setDOTW();
    TB_NAME.setAttribute('class', 'rst-block ' + currRST.color.name);
    TB_NAME.firstElementChild.innerText = currRST.name;
    TB_START_LAYOVER.innerText = currRST.minStartLayover;
    TB_END_LAYOVER.innerText = currRST.minEndLayover;
    TB_RUNTIME.innerText = '--';
    TB_CYCLETIME.innerText = '--';
    TB_STOPS.innerText = '--';
}

function updateRSTdata(rst) {
    if (rst !== currRST) return;

    setDOTW();
    TB_NAME.setAttribute('class', 'rst-block ' + currRST.color.name);
    TB_NAME.firstElementChild.innerText = currRST.name;
    TB_START_LAYOVER.innerText = currRST.minStartLayover;
    TB_END_LAYOVER.innerText = currRST.minEndLayover;
    TB_RUNTIME.innerText = currRST.runTime + 'min';
    TB_CYCLETIME.innerText = currRST.cycleTime + 'min';
    TB_STOPS.innerText = currRST.stopCount;
}

function clearToolBarData() {
    currRST = null;

    clearDOTW();

    TB_NAME.setAttribute('class', 'rst-block');
    TB_NAME.firstElementChild.innerText = 'N/A';
    TB_START_LAYOVER.innerText = '--';
    TB_END_LAYOVER.innerText = '--';
    TB_RUNTIME.innerText = '--';
    TB_CYCLETIME.innerText = '--';
    TB_STOPS.innerText = '--';
}

function setDOTW() {
    let DOTW = TB_DOTW.querySelectorAll('input');

    DOTW.forEach(elem => {
        elem.removeAttribute('checked');
    });

    currRST.appliedDays.array.forEach(day => {
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

    DOTW.forEach(day => {
        day.removeAttribute('checked');
    });
}

export { setToolBarData, clearToolBarData, updateRSTdata };