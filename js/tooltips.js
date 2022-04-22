import * as Config from './configuration.js';

if (!document.getElementById('tooltips_css')) { Config.loadStyleSheet('tooltips'); }

const TOOLTIPPED_ELEMS = document.querySelectorAll('[data-tooltip]');

let tooltips = new Map();

function initTooltips() {
    TOOLTIPPED_ELEMS.forEach(elem => {
        tooltips.set(
            elem,
            new Tooltip(
                elem,
                elem.dataset.direction,
                elem.dataset.tooltip
            )
        );
    });
}

class Tooltip {
    constructor(elem, dir, msg) {
        this.elem = elem;
        this.dir = dir;
        this.msg = msg;

        this.#constructElem();

        this.elem.addEventListener(
            'mouseenter', 
            this.#handleElemHover.bind(this)
        );
        this.elem.addEventListener(
            'mouseleave',
            this.#handleElemLeave.bind(this)
        );
    }

    #handleElemHover() {
        this.#setPosition();
        this.tooltip.classList.toggle('fade-in');
        this.tooltip.style.visibility = 'visible';
    }

    #handleElemLeave() {
        this.tooltip.classList.toggle('fade-in');
        this.tooltip.style.visibility = 'collapse';
    }

    #constructElem() {
        this.tooltip = document.createElement('span');
        this.tooltip.classList.add('tooltip');
        this.tooltip.innerText = this.msg;

        document.body.appendChild(this.tooltip);
    }

    #setPosition() {
        let offsets = this.elem.getBoundingClientRect();

        switch(this.dir) {
            case('up'):
                this.tooltip.style.top = (offsets.top - this.elem.clientHeight - 22) + 'px';
                this.tooltip.style.left = (offsets.left + (this.elem.clientWidth / 2)) + 'px';
                this.tooltip.style.transform = 'translate(-50%, 50%)';
                break;
            case('left'):
                this.tooltip.style.top = (offsets.top + (this.elem.clientHeight / 2)) + 'px';
                this.tooltip.style.left = (offsets.left - this.tooltip.offsetWidth - 5) + 'px';
                this.tooltip.style.transform = 'translateY(-50%)';
                break;
            case('right'):
                this.tooltip.style.top = (offsets.top + (this.elem.clientHeight / 2)) + 'px';
                this.tooltip.style.left = (offsets.left + this.elem.clientWidth + 5) + 'px';
                this.tooltip.style.transform = 'translateY(-50%)';
                break;
            case ('down'):
            default:
                this.tooltip.style.top = (offsets.top + this.elem.clientHeight + 5) + 'px';
                this.tooltip.style.left = (offsets.left + (this.elem.clientWidth / 2)) + 'px';
                this.tooltip.style.transform = 'translateX(-50%)';
                break;
        }
    }
}

export { initTooltips };