const SIDE_NAV = document.getElementById('side_nav');
const OPEN_NAV_BTN = document.getElementById('open_side_nav');
const CLOSE_NAV_BTN = document.getElementById('close_side_nav');
const DOC_BODY = document.getElementsByTagName('body')[0];

const NAV_OVERLAY = document.createElement('div');
NAV_OVERLAY.setAttribute('class', 'nav-overlay');
NAV_OVERLAY.setAttribute('id', 'nav_overlay');

function initSideNav() {
    OPEN_NAV_BTN.addEventListener('click', handleOpenNav);
    CLOSE_NAV_BTN.addEventListener('click', handleCloseNav);
    NAV_OVERLAY.addEventListener('click', handleCloseNav);
}

function handleOpenNav() {
    SIDE_NAV.style.width = "300px";

    DOC_BODY.appendChild(NAV_OVERLAY);
    DOC_BODY.style.overflow = 'hidden';
}

function handleCloseNav() {
    SIDE_NAV.style.width = "0";

    DOC_BODY.removeChild(NAV_OVERLAY);
    DOC_BODY.style.overflow = 'initial';
}

export { initSideNav };