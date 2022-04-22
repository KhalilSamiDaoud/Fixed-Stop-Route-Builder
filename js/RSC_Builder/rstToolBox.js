import * as RouteBuilder from './routeBuilder.js';
import * as Config from '../configuration.js';
import * as RST from './rst.js';

if (!document.getElementById('rstToolbox_css')) { Config.loadStyleSheet('rstToolbox'); }
if (!document.getElementById('rst&rsc_css')) { Config.loadStyleSheet('rst&rsc'); }

const RST_TOOLBOX_LIST = document.getElementById('rst_toolbox_list');
//id by rst.id
const toolboxEntries = new Map();

function initToolbox() {
    RST.getRSTs().forEach( rst => {
        addToolboxEntry(rst)
    });
}

function addToolboxEntry(rst) {
    toolboxEntries.set(rst.id, new ToolboxEntry(rst));
}

function updateToolboxEntry(rst) {
    if (!toolboxEntries.get(rst.id))
        addToolboxEntry(rst)

    toolboxEntries.get(rst.id).update(rst);
}

function removeToolboxEntry(rst) {
    toolboxEntries.get(rst.id).destroy();
}

function clearToolboxEntries() {
    toolboxEntries.forEach( entry => {
        entry.destroy();
    });

    toolboxEntries.clear();
}

//elem ID = rst.id + '-toolbox'
class ToolboxEntry {
    constructor(rst) {
        this.rst = rst;

        this.#constructElement();
    }

    destroy() {
        toolboxEntries.delete(this.rst.id);
        RST_TOOLBOX_LIST.removeChild(this.elem);
    }

    update(rst) {
        this.rst = rst
    }

    #constructElement() {
        this.elem = document.createElement('li');
        this.elem.classList.add('rst-entry');

        this.elem.rstElem = this.rst.elem.cloneNode(true);
        this.elem.rstElem.setAttribute('draggable', 'true');

        this.elem.rstElem.addEventListener('dragstart', this.#handleDragStart.bind(this));
        this.elem.rstElem.addEventListener('dragend', this.#handleDragEnd.bind(this));

        this.elem.tableElem = document.createElement('table');
        this.elem.tableElem.classList.add('push-right');
        this.elem.tableElem.innerHTML = '<tr><th>Applied days:</th></tr><tr><td><i>' + this.rst.appliedDays.string + '</i></td></tr>';


        this.elem.editBtn = document.createElement('a');
        this.elem.editBtn.setAttribute('href', ('../RSTBuilder?rst=' + this.rst.id));
        this.elem.editBtn.classList.add('material-icons', 'icon-btn-flat', 'small');
        this.elem.editBtn.innerText = 'edit';

        this.elem.appendChild(this.elem.rstElem);
        this.elem.appendChild(this.elem.tableElem);
        this.elem.appendChild(this.elem.editBtn);

        RST_TOOLBOX_LIST.appendChild(this.elem);
    }

    #handleDragStart(e) {
        RouteBuilder.elem.set(e.currentTarget);
        RouteBuilder.ghostPlaceHolder.style.width = (RouteBuilder.elem.val.clientWidth) + 'px';

        e.dataTransfer.setData('text/plain', e.target.dataset.oid);
        e.dataTransfer.dropEffect = "none";

        let ghost = e.target.cloneNode(true);
        ghost.id = (ghost.id + '-ghost');
        document.body.appendChild(ghost);
        ghost.style.transform = 'translate(-500%, -500%)';

        let xOffset = (ghost.clientWidth / 2);
        let yOffset = (ghost.clientHeight / 2);

        e.dataTransfer.setDragImage(ghost, xOffset, yOffset);

        RouteBuilder.placeholderSwitch.set(true);
    }

    #handleDragEnd(e) {
        document.body.removeChild(document.getElementById((e.target.id + '-ghost')))

        RouteBuilder.placeholderSwitch.set(false);
        RouteBuilder.lastTriggeredDragOver.set(null);
        RouteBuilder.entryCounter.set(0);
        RouteBuilder.elem.set(null);
    }
}

export { initToolbox, addToolboxEntry, updateToolboxEntry, removeToolboxEntry, clearToolboxEntries };