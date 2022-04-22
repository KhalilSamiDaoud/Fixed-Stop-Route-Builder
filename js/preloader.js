const PRE_LOADER = document.getElementById('pre_loader');
const PROG_ELEM = PRE_LOADER.getElementsByTagName('progress')[0];

let preLoaderTimeout;

function setProgress(progress) {
    PROG_ELEM.setAttribute("value", progress);
}

function incrementProgress() {
    let newVal = (PROG_ELEM.getAttribute("value") + 5);

    PROG_ELEM.setAttribute("value", newVal);
}

function removePreLoader() {
    PROG_ELEM.setAttribute("value", "100");

    preLoaderTimeout = setTimeout(() => {
        PRE_LOADER.classList.add('fade-out');
    }, 500);

    preLoaderTimeout = setTimeout(() => {
        document.body.removeChild(PRE_LOADER);

        clearTimeout(preLoaderTimeout);
    }, 1500);
}

export { setProgress, removePreLoader };