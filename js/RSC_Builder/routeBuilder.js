import * as Utils from '../utils.js';
import * as Config from '../configuration.js';
import * as Toolbar from './toolbar_RSC.js';
import * as RouteMap from './routeMap.js';
import * as Route from './route.js';
import * as Modal from '../modal.js';
import * as RSC from './rsc.js';
import * as RST from './rst.js';
import * as RouteDetails from './routeDetails.js';
import * as APIoutput from './testOutput.js'; //replace with real api script

if (!document.getElementById('routeBuilder_css')) { Config.loadStyleSheet('routeBuilder'); }
if (!document.getElementById('rst&rsc_css')) { Config.loadStyleSheet('rst&rsc'); }

const ROUTE_BUILDER = document.getElementById('route_builder');
const RSC_ID_LIST = document.getElementById('rsc_id_container');
const RSC_BUILDER_LIST = document.getElementById('rsc_builder_container');
const ADD_ROUTE_BTN = document.getElementById('add_route_btn');
const ROUTE_MODAL_ELEM = document.getElementById('route_modal');
const ROUTE_FORM_ELEM = document.getElementById('route_form');

//ID by RSC ID
const routeBuilderEntries = new Map();

const ghostPlaceHolder = document.createElement('div');
ghostPlaceHolder.setAttribute('id', 'ghostPlaceHolder');
ghostPlaceHolder.style.height = '100%';

const endPlaceHolder = document.createElement('div');
endPlaceHolder.setAttribute('id', 'endPlaceHolder');
endPlaceHolder.style.height = '100%';
endPlaceHolder.style.width = '75px';
endPlaceHolder.addEventListener('dragover', handleChildDragOver);

const lastTriggeredDragOver = {
    val: null,
    set: function (newVal) { lastTriggeredDragOver.val = newVal; }
}
const placeholderSwitch = {
    val: false,
    set: function (newVal) { placeholderSwitch.val = newVal; }
}
const entryCounter = {
    val: 0,
    set: function (newVal) { entryCounter.val = newVal; }
}
const elem = {
    val: null,
    set: function (newVal) { elem.val = newVal; }
}

let currSortable, currBuilder;

function initRouteBuilder() {
    ADD_ROUTE_BTN.addEventListener(
        'click', 
        RouteBuilderEntry.openRouteModal
    );
    ROUTE_MODAL_ELEM.querySelector('#route_modal_cancel').addEventListener(
        'click',
        RouteBuilderEntry.handleRouteCancel
    );

    Route.getRoutes().forEach( route => {
        addRouteBuilderEntry(route);
    });
}

function addRouteBuilderEntry(route) {
    routeBuilderEntries.set(route.id, new RouteBuilderEntry(route));
}

function updateRouteBuilderEntry(route) {
    if (!routeBuilderEntries.get(route.id))
        addRouteBuilderEntry(route);

    routeBuilderEntries.get(route.id).update(route);
}

function getRouteBuilderEntries() {
    return routeBuilderEntries;
}

function getRouteBuilderEntry(routeBuilderEntry) {
    return routeBuilderEntries.get(routeBuilderEntry);
}

function removeRouteBuilderEntry(route) {
    routeBuilderEntries.get(route.id).destroy();
}

function clearRouteBuilderEntries() {
    routeBuilderEntries.forEach(entry => {
        entry.destroy();
    });

    routeBuilderEntries.clear();
}

function setSortable(builderEntry) {
    if (currBuilder) {
        currBuilder.el.removeChild(endPlaceHolder);

        [...currBuilder.el.children].forEach(node => {
            let classes = node.classList;

            if (classes.contains('rst-block') || classes.contains('rsc-block'))
                node.removeEventListener('dragover', handleChildDragOver);
        });

        currBuilder.el.removeEventListener('dragover', handleDragOver);
        currBuilder.el.removeEventListener('dragenter', handleDragEnter);
        currBuilder.el.removeEventListener('dragleave', handleDragLeave);
        currBuilder.el.removeEventListener('drop', handleDrop);
        currBuilder.destroy();
    }

    currBuilder = Sortable.create(builderEntry, {
        group: 'active',
        sort: false,
        animation: 150,
        draggable: '',
        swapThreshold: 1
    });

    currBuilder.el.appendChild(endPlaceHolder);
    currBuilder.el.addEventListener('dragover', handleDragOver);
    currBuilder.el.addEventListener('dragenter', handleDragEnter);
    currBuilder.el.addEventListener('dragleave', handleDragLeave);
    currBuilder.el.addEventListener('drop', handleDrop);

    updateDropZone();
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function handleChildDragOver(e) {
    e.preventDefault();

    lastTriggeredDragOver.set(e.currentTarget);

    if (placeholderSwitch.val)
        currSortable.builderElem.insertBefore(ghostPlaceHolder, e.currentTarget);
}

function handleDragEnter(e) {
    e.preventDefault();
    entryCounter.set(++entryCounter.val);
}

function handleDragLeave(e) {
    e.preventDefault();
    entryCounter.set(--entryCounter.val);

    if (entryCounter.val === 0 && [...currBuilder.el.children].includes(ghostPlaceHolder))
        currSortable.builderElem.removeChild(ghostPlaceHolder);
}

function handleDrop(e) {
    e.preventDefault();
    if (e.currentTarget !== ghostPlaceHolder && 
        e.currentTarget !== currSortable.builderElem &&
        e.currentTarget !== endPlaceHolder) return;

    const data = e.dataTransfer.getData("text/plain");
    let targetRST = RST.getRST(data);
    let clonedNode = targetRST.elem.cloneNode(true);
    clonedNode.removeAttribute('draggable');
    clonedNode.firstElementChild.addEventListener(
        'click',
        targetRST.handleBuilderRemove.bind(targetRST, clonedNode, RSTremoveCallback)
    );

    if (!lastTriggeredDragOver.val || lastTriggeredDragOver.val === endPlaceHolder) {
        currSortable.builderElem.insertBefore(clonedNode, endPlaceHolder);
        Utils.scrollToEnd(ROUTE_BUILDER);

        RSC.RSC.handleNew(data, clonedNode);
    }
    else {
        currSortable.builderElem.insertBefore(clonedNode, lastTriggeredDragOver.val);
        currSortable.updateRouteRSCs();
        currSortable.route.updateStopSequence();
        RouteMap.getMapRoute(currSortable.route.id).update();
    }

    correctRouteEntities();
    updateDropZone();

    placeholderSwitch.set(false);
    lastTriggeredDragOver.set(null);
    entryCounter.set(0);
    elem.set(null);
}

function updateDropZone() {
    [...currBuilder.el.children].forEach( node => {
        let classes = node.classList;

        if (classes.contains('rst-block') || classes.contains('rsc-block'))
            node.addEventListener('dragover', handleChildDragOver);
    });
}

function correctRouteEntities() {
    if (currSortable.builderElem.lastChild !== endPlaceHolder) {
        currSortable.builderElem.removeChild(endPlaceHolder);
        currSortable.builderElem.appendChild(endPlaceHolder);
    }

    if (currSortable.builderElem.contains(ghostPlaceHolder))
        currSortable.builderElem.removeChild(ghostPlaceHolder);
}

function RSTremoveCallback(RSTelem) {
    if (!RSTelem.nextElementSibling.classList.contains('rsc-block')) return;

    let targetRSC = RSC.getRSC(+RSTelem.nextElementSibling.dataset.oid);

    if (targetRSC.isMultiRSC) {
        targetRSC.variationRSCs.forEach( rsc => {
            currSortable.route.removeOwnedRSC(rsc.id);
        });
    }
    currSortable.route.removeOwnedRSC(targetRSC.id);

    RSTelem.nextElementSibling.remove();
    RSTelem.remove();

    RouteMap.getMapRoute(currSortable.route.id).update();
    //handle object cleaning / fixing here after removal od RSC/RST combo
}

class RouteBuilderEntry {
    constructor(route) {
        this.route = route;

        this.#constructElems();
    }

    bindedUpdateEvent = RouteBuilderEntry.handleRouteUpdate.bind(this);
    static bindedRoute = null;

    update() {
        this.IDelem.name.title = this.route.name;
        this.IDelem.name.innerText = this.route.name;

        this.IDelem.color.removeAttribute('class');
        this.IDelem.color.classList.add(this.route.color.name);
    }

    updateRouteRSCs() {
        let rsts = [];

        [...this.builderElem.children].forEach( node => {
            if (node.classList.contains('rst-block')) {
                rsts.push(+node.dataset.oid);
            }

            else if (node.classList.contains('rsc-block')) {
                let targetRSC = RSC.getRSC(+node.dataset.oid);

                targetRSC.rsts.clear();
                rsts.forEach( rstID => {
                    targetRSC.addRST(rstID);
                });
                targetRSC.updateVehiclesAndIterations();
                Toolbar.updateRSCdata(targetRSC);

                if(targetRSC.isMultiRSC) {
                    targetRSC.variationRSCs.forEach( variation => {
                        variation.rsts.clear();
                        rsts.forEach(rstID => {
                            variation.addRST(rstID);
                        });
                        variation.updateVehiclesAndIterations();
                        Toolbar.updateRSCdata(variation);
                    });
                }
                rsts = [];
            }
        });
    }

    destroy() {
        //fill
    }

    #constructElems() {
        //CONSTRUCT ID
        this.IDelem = document.createElement('div');
        this.IDelem.classList.add('rsc-id-entry');
        this.IDelem.addEventListener('click', RouteBuilderEntry.openRouteModal.bind(this));

        this.IDelem.name = document.createElement('p');
        this.IDelem.name.title = this.route.name;
        this.IDelem.name.innerText = this.route.name;

        this.IDelem.color = document.createElement('div');
        this.IDelem.color.classList.add(this.route.color.name);

        this.IDelem.divider = document.createElement('div');
        this.IDelem.divider.classList.add('divider');

        this.IDelem.appendChild(this.IDelem.name);
        this.IDelem.appendChild(this.IDelem.color);
        this.IDelem.appendChild(this.IDelem.divider);

        //CONSTRUCT CONTAINER
        this.builderElem = document.createElement('div');
        this.builderElem.classList.add('route');

        this.builderElem.centerLine = document.createElement('div');
        this.builderElem.centerLine.classList.add('route-center');

        this.builderElem.addEventListener('click', this.#handleBuilderClick.bind(this));

        this.builderElem.appendChild(this.builderElem.centerLine);

        //CONSTRUCT BUILDER
        let sequences = new Map() //key: rsc, val: sequence;
        let sequenceMatched = false;
        let parentRSC = null;

        this.route.rscs.forEach( RSCentry => {
            sequenceMatched = false;
            parentRSC = null;

            [...sequences.entries()].forEach(sequence => {
                if (Utils.arraysAreEqual(sequence[1], [...RSCentry.rsts.keys()])) {
                    sequenceMatched = true; 
                    parentRSC = sequence[0];
                }  
            });

            if (sequenceMatched) {
                RSCentry.isVariation = true;
                RSCentry.parent = parentRSC;

                parentRSC.addVariation(RSCentry);
            }
            else {
                sequences.set(RSCentry, [...RSCentry.rsts.keys()]);

                RSCentry.rsts.forEach( RSTentry => {
                    let RSTelem = RSTentry.elem.cloneNode(true);
                    RSTelem.firstElementChild.addEventListener(
                        'click', 
                        RSTentry.handleBuilderRemove.bind(RSTentry, RSTelem, RSTremoveCallback)
                    );

                    this.builderElem.appendChild(RSTelem);
                });

                this.builderElem.appendChild(RSCentry.elem);
            }
        });

        RSC_ID_LIST.insertBefore(this.IDelem, ADD_ROUTE_BTN);
        RSC_BUILDER_LIST.appendChild(this.builderElem);
    }

    deleteRSC(rsc) {
        this.route.removeOwnedRSC(rsc.id);
        rsc.isMarkedDeleted = true;
        APIoutput.enableSaveBtn();

        if (!rsc.isVariation && !rsc.isMultiRSC)
            this.removeRSCelements(rsc.elem, true);
        else if (rsc.isVariation) 
            this.removeVariation(rsc);
        else if (rsc.isMultiRSC)
            this.newMultiRSC(rsc);

        this.updateRouteRSCs();
        RouteMap.getMapRoute(this.route.id).update();
    }

    //remove RSC and associated RST's
    removeRSCelements(rscElem, removeOrigin=false) {
        let origin = rscElem;

        while (origin.previousSibling)
            if (origin.previousSibling.classList.contains('rst-block'))
                origin.previousSibling.remove();
            else
                break;

        if (removeOrigin)
            origin.remove();
    }

    //remove RSC block in case of variation deletion
    removeVariation(rsc) {
        rsc.elem.content.remove();
        rsc.parent.removeVariation(rsc);
    }

    //create new variation block if original is removed
    newMultiRSC(rsc) {
        let newMultiRSC = [...rsc.variationRSCs.values()][0];
        newMultiRSC.elem.appendChild(newMultiRSC.elem.content);
        newMultiRSC.elem.content.classList.remove('variation');
        newMultiRSC.isVariation = false;
        newMultiRSC.isMultiRSC = false;

        rsc.removeVariation(newMultiRSC);

        if (rsc.isMultiRSC) {
            [...rsc.variationRSCs.values()].forEach( variation => {
                newMultiRSC.addVariation(variation);
            });
        }
        rsc.elem.replaceWith(newMultiRSC.elem);
    }

    setSelected() {
        this.builderElem.classList.add('selected');
        this.IDelem.classList.add('selected');
    }

    removeSelected() {
        this.builderElem.classList.remove('selected');
        this.IDelem.classList.remove('selected');
    }

    #handleBuilderClick() {
        if (currSortable === this) return;
        if (currSortable) currSortable.removeSelected();

        setSortable(this.builderElem);
        Toolbar.setToolBarData(this.route);

        if (RouteMap.currRouteMap)
            RouteMap.currRouteMap.hideRSC();

        RouteMap.getMapRoute(this.route.id).setDefault();
        RouteDetails.getRouteDetails(this.route.id).setDetails();

        currSortable = this;
        currSortable.setSelected();
        RouteDetails.enableBuildBtn();
    }

    static openRouteModal() {
        const ROUTE_MODAL = Modal.getModals().get('route_modal');
        let isNew = !(this instanceof RouteBuilderEntry);

        ROUTE_MODAL_ELEM.querySelector('.modal-header h1').innerText = (isNew) ? 'Add New Route' : 'Edit Route';
        ROUTE_MODAL_ELEM.querySelector('#route_modal_submit').innerText = (isNew) ? 'ADD' : 'UPDATE';

        if(!isNew) {
            ROUTE_FORM_ELEM.querySelector('#route_name').value = this.route.name;
            ROUTE_FORM_ELEM.querySelector('#route_color').value = this.route.color.name;

            ROUTE_MODAL_ELEM.querySelector('#route_modal_submit').addEventListener(
                'click',
                this.bindedUpdateEvent
            );

            RouteBuilderEntry.bindedRoute = this;
        }
        else {
            ROUTE_MODAL_ELEM.querySelector('#route_modal_submit').addEventListener(
                'click',
                RouteBuilderEntry.handleRouteSubmit
            );
        }

        ROUTE_MODAL.open();
    }

    static handleRouteSubmit() {
        const ROUTE_MODAL = Modal.getModals().get('route_modal');
        const formData = new FormData(ROUTE_FORM_ELEM);

        if (!formData.get('route_name'))
            ROUTE_FORM_ELEM.querySelector('#route_name').parentElement.classList.add('invalid');
        else {               
            ROUTE_FORM_ELEM.querySelector('#route_name').parentElement.classList.remove('invalid'); 
            ROUTE_MODAL_ELEM.querySelector('#route_modal_submit').removeEventListener(
                'click',
                RouteBuilderEntry.handleRouteSubmit,
            );

            const params = {
                id: (Math.random() * 1),
                name: formData.get('route_name'),
                color: formData.get('route_color'),
                rscs: []
            }

            let tempRoute = Route.addRoute(params);
            addRouteBuilderEntry(tempRoute);
            RouteMap.addMapRouteEntry(tempRoute);
            RouteDetails.addRouteDetails(tempRoute);

            ROUTE_FORM_ELEM.reset();
            ROUTE_MODAL.close();
        }
    }

    static handleRouteUpdate() {
        const ROUTE_MODAL = Modal.getModals().get('route_modal');
        const formData = new FormData(ROUTE_FORM_ELEM);

        if (!formData.get('route_name'))
            ROUTE_FORM_ELEM.querySelector('#route_name').parentElement.classList.add('invalid');
        else {
            ROUTE_FORM_ELEM.querySelector('#route_name').parentElement.classList.remove('invalid');
            ROUTE_MODAL_ELEM.querySelector('#route_modal_submit').removeEventListener(
                'click',
                this.bindedUpdateEvent,
            );

            const params = {
                id: this.route.id,
                name: formData.get('route_name'),
                color: formData.get('route_color'),
                rscs: this.route.rscs
            }

            Route.updateRoute(params);
            Toolbar.updateRouteData(this.route);
            this.update();

            ROUTE_FORM_ELEM.reset();
            ROUTE_MODAL.close();
        }
    }

    static handleRouteCancel() {
        ROUTE_FORM_ELEM.querySelector('#route_name').parentElement.classList.remove('invalid');

        if (RouteBuilderEntry.bindedRoute) {
            ROUTE_MODAL_ELEM.querySelector('#route_modal_submit').removeEventListener(
                'click',
                RouteBuilderEntry.bindedRoute.bindedUpdateEvent,
            );
        }
        else {
            ROUTE_MODAL_ELEM.querySelector('#route_modal_submit').removeEventListener(
                'click',
                RouteBuilderEntry.handleRouteSubmit,
            );
        }

        RouteBuilderEntry.bindedRoute = null;
        ROUTE_FORM_ELEM.reset();
    }
}

export { initRouteBuilder, addRouteBuilderEntry, updateRouteBuilderEntry, removeRouteBuilderEntry, 
    clearRouteBuilderEntries, getRouteBuilderEntries, getRouteBuilderEntry, updateDropZone,
    currSortable, currBuilder, lastTriggeredDragOver, placeholderSwitch, entryCounter, elem, ghostPlaceHolder, endPlaceHolder };