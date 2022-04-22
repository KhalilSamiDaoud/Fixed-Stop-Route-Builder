import * as Config from './configuration.js'

if (!document.getElementById('modal_css')) { Config.loadStyleSheet('modal'); }

const TRIGGERS = document.querySelectorAll('.modal-trigger');
const NON_TRIGGERED_MODALS = document.querySelectorAll('.modal');
const DOC_BODY = document.getElementsByTagName('body')[0];

const MODAL_OVERLAY = document.createElement('div');
MODAL_OVERLAY.setAttribute('class', 'modal-overlay');
MODAL_OVERLAY.setAttribute('id', 'modal_overlay');

const modals = new Map();

let activeModal = null;

function initModals() {
    TRIGGERS.forEach( trigger => {
        let target = trigger.dataset.target;
        let elem = document.getElementById(target);
        if (elem) {
            modals.set(target, new Modal(target, trigger, elem));
        }
        else
            console.warn('No valid modal target found: ' + target);
    });

    NON_TRIGGERED_MODALS.forEach( modal => {
        if(!modals.has(modal.id))
            modals.set(modal.id, new Modal(modal.id, null, modal));
    });

    MODAL_OVERLAY.addEventListener('click', Modal.handleCloseModal);
}

function getModals() {
    return modals;
}

function getModal(id) {
    return modals.get(id);
}

class Modal {
    constructor(id, trigger, modal) {
        this.id = id;
        this.trigger = trigger;
        this.modal = modal;

        this.isOpen = false;
        this.dismissable = (this.modal.hasAttribute('data-persist')) ? false : true;
        this.closers = this.modal.querySelectorAll('.close');

        if(this.trigger)
            this.trigger.addEventListener('click', this.open.bind(this));

        [...this.closers].forEach(closer => {
            closer.addEventListener('click', Modal.handleCloseModal.bind(this));
        });
    }

    open() {
        activeModal = this;
        let isOverlay = false;

        modals.forEach( entry => {
            if (entry.isOpen) {
                entry.modal.style.visibility = 'collapse';
                entry.isOpen = false;

                isOverlay = true;
            }
        });

        this.modal.style.left = (document.documentElement.clientWidth - this.modal.offsetWidth) / 2 + 'px';
        this.modal.style.top = (document.documentElement.clientHeight - this.modal.offsetHeight) / 2 + window.pageYOffset + 'px';

        this.modal.style.visibility = 'visible';
        this.isOpen = true;

        if (!isOverlay) {
            DOC_BODY.appendChild(MODAL_OVERLAY);
            DOC_BODY.style.overflow = 'hidden';
        }
    }

    close() {
        this.modal.style.visibility = 'collapse';

        DOC_BODY.removeChild(MODAL_OVERLAY);
        DOC_BODY.style.overflow = 'initial';

        activeModal = null;
        this.isOpen = false;
    }

    static handleCloseModal(e) {
        if (e.currentTarget === MODAL_OVERLAY) {
            if (!activeModal.dismissable) return;
        }

        modals.forEach( entry => {
                entry.modal.style.visibility = 'collapse';
                entry.isOpen = false;
        });

        DOC_BODY.removeChild(MODAL_OVERLAY);
        DOC_BODY.style.overflow = 'initial';

        activeModal = null;
    }
}

export { initModals, getModals, getModal };