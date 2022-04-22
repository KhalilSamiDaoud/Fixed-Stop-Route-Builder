import * as Config from '../configuration.js';

if (!document.getElementById('rscContextMenu_css')) { Config.loadStyleSheet('rscContextMenu'); }

const HTML_ELEM = document.getElementsByTagName('html')[0];
const CONT_MENU = document.getElementById('rsc_context_menu');
const CONT_MENU_ENTRIES = CONT_MENU.firstElementChild.children;
//0 = add Variation, 1 = edit config, 2 = delete config

let bindedAdd, bindedEdit, bindedDelete;

function clearEventHandlers() {
    CONT_MENU_ENTRIES[0].removeEventListener('click', bindedAdd);
    CONT_MENU_ENTRIES[1].removeEventListener('click', bindedEdit);
    CONT_MENU_ENTRIES[2].removeEventListener('click', bindedDelete);
}

function handleContextMenu(e) {
    e.preventDefault();

    if (this.isVariation)
        CONT_MENU_ENTRIES[0].classList.add('disabled');
    else {
        bindedAdd = this.handleAdd.bind(this);
        CONT_MENU_ENTRIES[0].classList.remove('disabled');
        CONT_MENU_ENTRIES[0].addEventListener('click', bindedAdd);
    }

    bindedEdit = this.handleEdit.bind(this);
    CONT_MENU_ENTRIES[1].addEventListener('click', bindedEdit);

    bindedDelete = this.handleDelete.bind(this);
    CONT_MENU_ENTRIES[2].addEventListener('click', bindedDelete);

    let pageX = e.pageX;
    let pageY = e.pageY;
    let mwidth = CONT_MENU.offsetWidth;
    let mheight = CONT_MENU.offsetHeight;
    let screenWidth = window.outerWidth;
    let screenHeight = window.outerHeight;
    let scrTop = window.scrollY;

    CONT_MENU.style.visibility = 'hidden';
    CONT_MENU.style.top = pageY + 'px';
    CONT_MENU.style.left = pageX + 'px';

    if (pageX + mwidth > screenWidth)
        CONT_MENU.style.left = (pageX - mwidth);

    if (pageY + mheight > screenHeight + scrTop)
        CONT_MENU.style.top = (pageY - mheight);


    CONT_MENU.style.visibility = 'visible';
}

HTML_ELEM.addEventListener('click', () => {
    CONT_MENU.style.visibility = 'hidden';
    clearEventHandlers();
});

export { handleContextMenu, clearEventHandlers };