import * as RST from './rst.js';
import * as Utils from '../utils.js';
import * as Modal from '../modal.js';
import * as RouteBuilder from './routeBuilder.js';
import * as ContextMenu from './rscContextMenu.js';
import * as Toolbar from './toolbar_RSC.js';
import * as RouteMap from './routeMap.js';
import * as APIoutput from './testOutput.js' //replace with real api script (APIoutput.js)

const CANCEL_BTN = document.getElementById('rsc_modal_cancel');
const SUBMIT_BTN = document.getElementById('rsc_modal_submit');
const MSG_ELEM = document.getElementById('confirmation_message');
const CONFIRM_BTN = document.getElementById('confirmation_confirm');
const REJECT_BTN = document.getElementById('confirmation_reject');

const DAY_INPUT_NAMES = [
    { name: 'rsc_monday', code: 'M' },
    { name: 'rsc_tuesday', code: 'T' }, 
    { name: 'rsc_wednesday', code: 'W' }, 
    { name: 'rsc_thursday', code: 'R' }, 
    { name: 'rsc_friday', code: 'F' }, 
    { name: 'rsc_saturday', code: 'S' }, 
    { name: 'rsc_sunday', code: 'U' }
];

const rscs = new Map(); //key: rsc.id, val: rsc

function initRSCs(RSClist) {
    RSClist.forEach(entry => {
        addRSC(entry);
    });
}

function addRSC(params, isNew=false) {
    rscs.set(params.id, new RSC(params, isNew));

    return rscs.get(params.id);
}

function updateRSC(newParams) {
    if (!rscs.get(newParams.id))
        addRSC(newParams, true);

    rscs.get(newParams.id).update(newParams);
}

function removeRSC(id) {
    if (!rscs.delete(id))
        console.warn('removeRSC: rsc ' + id + 'does not exist');

    rscs.get(id).destroy();
    rscs.delete(id);
}

function getRSCs() {
    return rscs;
}

function getRSC(rscID) {
    return rscs.get(rscID);
}

function clearRSCs() {
    rscs.forEach(rsc => {
        rsc.destroy();
    });

    rscs.clear();
}

class RSC {
    constructor(params, isNew) {
        this.id = params.id;
        this.name = params.name;
        this.attributes = params.attributes;
        this.appliedDays = {
            array: params.appliedDays,
            string: params.appliedDays.join(', ')
        }
        this.startTime = {
            twentyFourHour: params.startTime,
            twelveHour: Utils.toTwelveHourTime(params.startTime)
        }
        this.endTime = {
            twentyFourHour: params.endTime,
            twelveHour: Utils.toTwelveHourTime(params.endTime)
        }
        this.headway = params.headway;
        this.busDisplay = params.busDisplay;

        //params.rsts can be given as a list of rst ID's so the corresponding rst Obj can be fetched. (rsts must be loaded first)
        this.rsts = new Map();
        params.rsts.forEach( RSTentry => {
            //later update this to accept repeating rsts (dont use Map) and use the drive time.
            this.rsts.set(RSTentry.id, RST.getRST(RSTentry.id));
        });

        this.iterationTime = params?.iterationTime;
        this.iterations = params?.iterations;
        this.vehicles = params?.vehicles;
        if (!this.iterations || !this.vehicles || !this.iterationTime) this.updateVehiclesAndIterations();

        this.isVariation = false;
        this.ownerRoute = null;
        this.parent = null;

        this.isMultiRSC = false;
        this.isOpen = false;
        this.variations = 0;
        this.variationRSCs = new Map(); //key: rsc.id val: rsc

        this.elem = this.#constructElem();

        this.modified = isNew;
        this.isMarkedDeleted = false;
    }

    bindedDeleteConfirmEvent = this.#handleDeleteConfirm.bind(this);
    bindedDeleteRejectEvent = this.#handleDeleteReject.bind(this);
    static bindedDeleteRSC = null;

    bindedRSCcancelEvent = this.#handleRSCcancel.bind(this);
    bindedRSCupdateEvent = this.#handleRSCupdate.bind(this);
    bindedRSCsubmitEvent = this.#handleRSCsubmit.bind(this);
    static bindedRSC = null;

    update(newParams) {
        this.name = newParams.name;
        this.startTime = {
            twentyFourHour: newParams.startTime,
            twelveHour: Utils.toTwelveHourTime(newParams.startTime)
        };
        this.endTime = {
            twentyFourHour: newParams.endTime,
            twelveHour: Utils.toTwelveHourTime(newParams.endTime)
        };
        this.headway = newParams.headway;
        this.busDisplay = newParams.busDisplay;
        this.appliedDays = {
            array: newParams.appliedDays,
            string: newParams.appliedDays.join(', ')
        }

        this.updateVehiclesAndIterations();
        this.#rebuildContent();

        this.modified = true;
        APIoutput.enableSaveBtn();
    }

    destroy() {
        this.ownerRoute.removeOwnedRSC(this.id);

        let routeBuilderEntry = RouteBuilder.getRouteBuilderEntry(this.ownerRoute.id);
        
        if(routeBuilderEntry)
            routeBuilderEntry.deleteRSC(this);

        RouteMap.getMapRoute(this.ownerRoute.id).update();
        Toolbar.removeRSCdata(this);
        this.isMarkedDeleted = true;
        APIoutput.enableSaveBtn();
    }

    toJSON() {
        let tempJSON = {
            id: this.id,
            name: this.name,
            rsts: [...this.rsts.keys()],
            iterations: this.iterations,
            vehicles: this.vehicles,
            startTime: this.startTime.twentyFourHour,
            endTime: this.endTime.twentyFourHour,
            attributes: [],
            headway: this.headway,
            busDisplay: this.busDisplay,
            appliedDays: this.appliedDays.array,
            markedDeleted: this.isMarkedDeleted
        };

        return tempJSON;
    }

    addRST(rstID) {
        this.rsts.set(rstID, RST.getRSTs().get(rstID));

        this.modified = true;
        APIoutput.enableSaveBtn();
    }

    addVariation(RSCentry) {
        this.variations++;
        this.variationRSCs.set(RSCentry.id, RSCentry);
        this.isVariation = false;
        this.isMultiRSC = true;

        RSCentry.parent = this;
        RSCentry.isVariation = true;
        this.ownerRoute.addOwnedRSC(RSCentry.id);

        if (this.isOpen) {
            RSCentry.elem.content.classList.add('variation');
            this.elem.appendChild(RSCentry.elem.content);
            this.elem.iconBtn.addEventListener('click', this.#setVariation.bind(this), { once: true });
        }
        else
            this.#setVariation();
    }

    removeVariation(RSCentry) {
        this.variationRSCs.delete(RSCentry.id);
        this.variations--;

        if (this.variations === 0) {
            this.isMultiRSC = false;
            this.#setVariation();

            if(this.isOpen)
                this.elem.iconBtn.dispatchEvent(new Event('click'));
        }

        if (this.isOpen)
            this.elem.iconBtn.addEventListener('click', this.#setVariation.bind(this), { once: true });
        else
            this.#setVariation();
    }

    updateVehiclesAndIterations() {
        let RSTtimeSum, vehCount, iterrCount;
        RSTtimeSum = vehCount = iterrCount = 0;

        this.rsts.forEach(rst => { RSTtimeSum += (rst.cycleTime); });
        vehCount = (this.headway != 0) ? (RSTtimeSum / this.headway) : 1;
        vehCount = (vehCount % 1 !== 0) ? Math.ceil(vehCount) : vehCount;

        let iterationTime = (this.headway != 0) ? (vehCount * this.headway) : RSTtimeSum;

        //fix time for clock face
        if (iterationTime < 30)
            iterationTime += ( 30 - iterationTime);
        else if (iterationTime < 60 && iterationTime > 30)
            iterationTime += (60 - iterationTime);
        else if ((iterationTime !== 30 && iterationTime !== 60)){
            let remainder = (iterationTime % 60);

            if (remainder < 30)
                iterationTime += (30 - remainder);
            else
                iterationTime += (60 - remainder);
        }

        let timeWindow = (Utils.parseTime(this.endTime.twelveHour) - Utils.parseTime(this.startTime.twelveHour));
        iterrCount = Math.floor(timeWindow / iterationTime);
        iterrCount = (iterrCount < 1) ? 1 : iterrCount;

        this.iterations = iterrCount;
        this.iterationTime = iterationTime;
        this.vehicles = vehCount;

        this.modified = true;
        APIoutput.enableSaveBtn();
    }

    #constructElem() {
        let elem = document.createElement('div');
        elem.setAttribute('data-oid', this.id);
        elem.classList.add('rsc-block');

        elem.iconBtn = document.createElement('i');
        elem.iconBtn.innerText = 'keyboard_arrow_right';
        elem.iconBtn.classList.add('material-icons', 'hide');
        elem.iconBtn.addEventListener('click', this.#handleRSCexpand.bind(this), { once: true });

        elem.varCount = document.createElement('a');
        elem.varCount.classList.add('hide');
        elem.varCount.count = document.createElement('span');
        elem.varCount.count.innerText = this.variations;

        elem.content = document.createElement('div');
        elem.content.classList.add('rsc-block-content');
        elem.content.addEventListener('contextmenu', ContextMenu.handleContextMenu.bind(this));

        elem.content.name = document.createElement('h5');
        elem.content.name.innerText = this.name;

        elem.content.table = document.createElement('table');
        elem.content.table.innerHTML =
        '<tr>' +
            '<td><b>Start: </b></td>' +
            '<td><b>End: </b></td>' +
        '</tr>';

        elem.content.table.startTime = elem.content.table.rows[0].cells[0];
        elem.content.table.startTime.firstChild.innerText = ('Start: ' + this.startTime.twelveHour);

        elem.content.table.endTime = elem.content.table.rows[0].cells[1];
        elem.content.table.endTime.firstChild.innerText = ('End: ' + this.endTime.twelveHour);

        elem.appendChild(elem.iconBtn);
        elem.appendChild(elem.varCount);
        elem.appendChild(elem.content);
        elem.varCount.appendChild(elem.varCount.count);
        elem.content.appendChild(elem.content.name);
        elem.content.appendChild(elem.content.table);

        return elem;
    }

    #rebuildContent() {
        let newContent = document.createElement('div');
        newContent.classList.add('rsc-block-content');
        newContent.addEventListener('contextmenu', ContextMenu.handleContextMenu.bind(this));

        if (this.elem.content.classList.contains('variation'))
            newContent.classList.add('variation');

        newContent.name = document.createElement('h5');
        newContent.name.innerText = this.name;

        newContent.table = document.createElement('table');
        newContent.table.innerHTML =
            '<tr>' +
            '<td><b>Start: </b></td>' +
            '<td><b>End: </b></td>' +
            '</tr>';

        newContent.table.startTime = newContent.table.rows[0].cells[0];
        newContent.table.startTime.firstChild.innerText = ('Start: ' + this.startTime.twelveHour);

        newContent.table.endTime = newContent.table.rows[0].cells[1];
        newContent.table.endTime.firstChild.innerText = ('End: ' + this.endTime.twelveHour);

        newContent.appendChild(newContent.name);
        newContent.appendChild(newContent.table);
        this.elem.content.replaceWith(newContent);
        this.elem.content = newContent;
    }

    #setVariation() {
        this.elem.classList.remove('single-variation', 'multi-variation');

        switch(this.variations) {
            case 0:
                this.elem.classList.remove('single-variation');
                this.elem.iconBtn.classList.add('hide');
                this.elem.varCount.classList.add('hide');
                return;
            case 1:
                this.elem.classList.add('single-variation');
                this.elem.iconBtn.classList.remove('hide');
                this.elem.varCount.classList.remove('hide');
                this.elem.varCount.count.innerText = (this.variations + 1);
                return;
            default:
                this.elem.classList.add('multi-variation');
                this.elem.iconBtn.classList.remove('hide');
                this.elem.varCount.classList.remove('hide');
                this.elem.varCount.count.innerText = (this.variations + 1);
                return;
        }
    }

    #handleRSCexpand() {
        this.isOpen = true;
        this.elem.iconBtn.innerText = 'keyboard_arrow_left';
        this.elem.varCount.classList.add('hide');

        this.variationRSCs.forEach( variation => {
            variation.elem.content.classList.add('variation');
            this.elem.appendChild(variation.elem.content);
        });

        if (this.elem.nextElementSibling.id === 'endPlaceHolder')
            Utils.scrollToEnd(this.elem.parentElement.parentElement.parentElement);
        
        this.elem.classList.remove('single-variation', 'multi-variation');

        this.elem.iconBtn.addEventListener('click', this.#handleRSCCollapse.bind(this), { once: true });
    }

    #handleRSCCollapse() {
        this.isOpen = false;
        let variationElems = this.elem.querySelectorAll('div.variation');

        this.elem.iconBtn.innerText = 'keyboard_arrow_right';
        this.elem.varCount.classList.remove('hide');

        variationElems.forEach(variation => {
            variation.classList.remove('variation');
            this.elem.removeChild(variation);
        });

        if (this.variations === 1)
            this.elem.classList.add('single-variation');
        else
            this.elem.classList.add('multi-variation');

        this.elem.iconBtn.addEventListener('click', this.#handleRSCexpand.bind(this), { once: true });
    }

    static handleNew(rstID, rstElem) {
        const RSC_MODAL = Modal.getModal('rsc_modal');
        const RSC_FORM = document.forms['rsc_form'];
        const TITLE_MSG = RSC_MODAL.modal.querySelector('.modal-header h1');

        function handleNewCancel() {
            rstElem.remove();

            [...RSC_FORM.elements].forEach(element => {
                element.parentElement.classList.remove('invalid');
            });
            RSC_FORM.elements['rsc_monday'].parentElement.parentElement.classList.remove('invalid');

            CANCEL_BTN.removeEventListener('click', handleNewCancel);
            SUBMIT_BTN.removeEventListener('click', handleNewSubmit);
            RSC_FORM.reset();
        }

        function handleNewSubmit() {
            let formData = new FormData(RSC_FORM);
            let daysOfTheWeek = [];

            if (RSC.validateRSCform(formData)) {
                DAY_INPUT_NAMES.forEach(day => {
                    if (RSC_FORM.elements[day.name].checked)
                        daysOfTheWeek.push(day.code);
                });

                const params = {
                    id: Math.random(), //needs to be given from backend on save
                    attributes: [],
                    rsts: [{id: +rstID, driveTime: 0 }],
                    name: formData.get('rsc_name'),
                    startTime: formData.get('rsc_start_time'),
                    endTime: formData.get('rsc_end_time'),
                    headway: formData.get('rsc_headway'),
                    busDisplay: formData.get('rsc_bus_display'),
                    appliedDays: daysOfTheWeek
                }

                //errors with the toolbar, also add some validation for DOTW to be at least 1 checked item
                let newRSC = addRSC(params);
                newRSC.ownerRoute = RouteBuilder.currSortable.route;
                newRSC.ownerRoute.addOwnedRSC(newRSC.id);

                RouteBuilder.currSortable.builderElem.insertBefore(newRSC.elem, RouteBuilder.endPlaceHolder);
                RouteBuilder.updateDropZone();

                CANCEL_BTN.removeEventListener('click', handleNewCancel);
                SUBMIT_BTN.removeEventListener('click', handleNewSubmit);
                RSC_MODAL.close();
                RSC_FORM.reset();

                RouteMap.getMapRoute(newRSC.ownerRoute.id).update();
                Toolbar.addRSCdata(newRSC);
            }
        }

        TITLE_MSG.innerText = 'New RSC Definition';
        SUBMIT_BTN.innerText = 'CREATE';

        CANCEL_BTN.addEventListener('click', handleNewCancel);
        SUBMIT_BTN.addEventListener('click', handleNewSubmit);

        RSC_MODAL.open();
    }

    handleAdd() {
        const RSC_MODAL = Modal.getModal('rsc_modal');
        const TITLE_MSG = RSC_MODAL.modal.querySelector('.modal-header h1');

        TITLE_MSG.innerText = 'New RSC Variation';
        SUBMIT_BTN.innerText = 'ADD';

        RSC.bindedRSC = this;
        CANCEL_BTN.addEventListener('click', this.bindedRSCcancelEvent);
        SUBMIT_BTN.addEventListener('click', this.bindedRSCsubmitEvent);

        RSC_MODAL.open();
        ContextMenu.clearEventHandlers();
    }

    handleEdit() {
        const RSC_MODAL = Modal.getModal('rsc_modal');
        const RSC_FORM = document.forms['rsc_form'];
        const TITLE_MSG = RSC_MODAL.modal.querySelector('.modal-header h1');

        TITLE_MSG.innerText = 'Edit RSC';
        SUBMIT_BTN.innerText = 'UPDATE';

        RSC_FORM.elements['rsc_name'].value = this.name;
        RSC_FORM.elements['rsc_start_time'].value = this.startTime.twentyFourHour;
        RSC_FORM.elements['rsc_end_time'].value = this.endTime.twentyFourHour;
        RSC_FORM.elements['rsc_headway'].value = this.headway;
        RSC_FORM.elements['rsc_bus_display'].checked = this.busDisplay;
        DAY_INPUT_NAMES.forEach( day => {
            RSC_FORM.elements[day.name].checked = this.appliedDays.array.includes(day.code);
        });

        RSC.bindedRSC = this;
        CANCEL_BTN.addEventListener('click', this.bindedRSCcancelEvent);
        SUBMIT_BTN.addEventListener('click', this.bindedRSCupdateEvent);

        RSC_MODAL.open();
        ContextMenu.clearEventHandlers();
    }

    #handleRSCcancel() {
        const RSC_FORM = document.forms['rsc_form'];

        [...RSC_FORM.elements].forEach( element => {
            element.parentElement.classList.remove('invalid');
        });
        RSC_FORM.elements['rsc_monday'].parentElement.parentElement.classList.remove('invalid');

        CANCEL_BTN.removeEventListener('click', RSC.bindedRSC.bindedRSCcancelEvent);
        SUBMIT_BTN.removeEventListener('click', RSC.bindedRSC.bindedRSCupdateEvent);
        SUBMIT_BTN.removeEventListener('click', RSC.bindedRSC.bindedRSCsubmitEvent);
        RSC_FORM.reset();
        RSC.bindedRSC = null;
    }

    #handleRSCsubmit() {
        const RSC_FORM = document.forms['rsc_form'];
        const RSC_MODAL = Modal.getModal('rsc_modal');

        let formData = new FormData(RSC_FORM);
        let daysOfTheWeek = [];

        if (RSC.validateRSCform(formData)) {
            DAY_INPUT_NAMES.forEach(day => {
                if (RSC_FORM.elements[day.name].checked)
                    daysOfTheWeek.push(day.code);
            });

            const params = {
                id: Math.random(), //needs to be given from backend on save
                attributes: this.attributes,
                rsts: [...this.rsts.keys()].map(key => { return {id: key, driveTime: 0}}),
                name: formData.get('rsc_name'),
                startTime: formData.get('rsc_start_time'),
                endTime: formData.get('rsc_end_time'),
                headway: formData.get('rsc_headway'),
                busDisplay: RSC_FORM.elements['rsc_bus_display'].checked,
                appliedDays: daysOfTheWeek
            }

            let newRSC = addRSC(params);
            this.addVariation(newRSC);

            SUBMIT_BTN.removeEventListener('click', RSC.bindedRSC.bindedRSCsubmitEvent);
            CANCEL_BTN.removeEventListener('click', RSC.bindedRSC.bindedRSCcancelEvent);
            RSC.bindedRSC = null;
            RSC_FORM.reset();
            RSC_MODAL.close();

            RouteMap.getMapRoute(newRSC.ownerRoute.id).update();
            Toolbar.addRSCdata(newRSC);
        }
    }

    #handleRSCupdate() {
        const RSC_FORM = document.forms['rsc_form'];
        const RSC_MODAL = Modal.getModal('rsc_modal');

        let formData = new FormData(RSC_FORM);

        if (RSC.validateRSCform(formData)) {
            let daysOfTheWeek = [];
            DAY_INPUT_NAMES.forEach(day => {
                if (RSC_FORM.elements[day.name].checked)
                    daysOfTheWeek.push(day.code);
            });

            const params = {
                name: formData.get('rsc_name'),
                startTime: formData.get('rsc_start_time'),
                endTime: formData.get('rsc_end_time'),
                headway: formData.get('rsc_headway'),
                busDisplay: RSC_FORM.elements['rsc_bus_display'].checked,
                appliedDays: daysOfTheWeek
            }

            this.update(params);

            SUBMIT_BTN.removeEventListener('click', RSC.bindedRSC.bindedRSCupdateEvent);
            CANCEL_BTN.removeEventListener('click', RSC.bindedRSC.bindedRSCcancelEvent);
            RSC.bindedRSC = null;
            RSC_FORM.reset();
            RSC_MODAL.close();

            Toolbar.updateRSCdata(this);
        }
    }

    handleDelete() {
        const CONFIRMATION_MODAL = Modal.getModal('confirmation_modal');

        MSG_ELEM.innerText = 'Delete RSC: ' + this.name + '?';
        CONFIRM_BTN.addEventListener('click', this.bindedDeleteConfirmEvent);
        REJECT_BTN.addEventListener('click', this.bindedDeleteRejectEvent);

        RSC.bindedDeleteRSC = this;
        CONFIRMATION_MODAL.open();
        ContextMenu.clearEventHandlers();
    }

    #handleDeleteConfirm() {
        CONFIRM_BTN.removeEventListener('click', RSC.bindedDeleteRSC.bindedDeleteConfirmEvent);
        REJECT_BTN.removeEventListener('click', RSC.bindedDeleteRSC.bindedDeleteRejectEvent);
        RSC.bindedDeleteRSC = null;

        RouteMap.getMapRoute(this.ownerRoute.id).update();
        Toolbar.removeRSCdata(this);

        let routeBuilderEntry = RouteBuilder.getRouteBuilderEntry(this.ownerRoute.id);
        routeBuilderEntry.deleteRSC(this);
    }

    #handleDeleteReject() {
        REJECT_BTN.removeEventListener('click', RSC.bindedDeleteRSC.bindedDeleteRejectEvent);
        CONFIRM_BTN.removeEventListener('click', RSC.bindedDeleteRSC.bindedDeleteConfirmEvent);

        RSC.bindedDeleteRSC = null;
    }

    static validateRSCform(formData) {
        const RSC_FORM = document.forms['rsc_form'];
        let allValid = true;
        let checked = 0;

        DAY_INPUT_NAMES.forEach(day => {
            if (RSC_FORM.elements[day.name].checked)
                checked++;
        });

        if(!checked) {
            RSC_FORM.elements['rsc_monday'].parentElement.parentElement.classList.add('invalid');
            allValid = false;
        }
        else
            RSC_FORM.elements['rsc_monday'].parentElement.parentElement.classList.remove('invalid');

        [...formData.keys()].forEach( input => {
            if (!formData.get(input)) {
                RSC_FORM.elements[input].parentElement.classList.add('invalid');
                allValid = false;
            }
            else
                RSC_FORM.elements[input].parentElement.classList.remove('invalid');
        });

        if (!Utils.stringIsPositiveInt(formData.get('rsc_headway'))) {
            RSC_FORM.elements['rsc_headway'].parentElement.classList.add('invalid');
            allValid = false;
        }
        else
            RSC_FORM.elements['rsc_headway'].parentElement.classList.remove('invalid');

        return allValid;
    }
}

export { initRSCs, addRSC, getRSCs, getRSC, removeRSC, updateRSC, clearRSCs, RSC };