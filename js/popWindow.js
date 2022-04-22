const WINDOW_PARAMS = 'toolbar=0,location=0,directories=0,status=0,menubar=0,scrollbars=1,resizable=1,width=500,height=500,';

var windows = new Map();

window.addEventListener('beforeunload', closePopWindows.bind(this));
window.addEventListener('unload', closePopWindows.bind(this));

function createPopWindow(title, dockCallback) {
    let pw = new PopWindow(title, dockCallback);
    windows.set(title, pw);

    return pw.win.document;
}

function removePopWindow(title) {
    windows.get(title).win.close();
    windows.delete(title);

    return document;
}

function closePopWindows() {
    windows.forEach(window => {
        window.win.close();
    });

    windows.clear();
}

class PopWindow {
    constructor(title = 'unknown', dockCallback) {
        this.win = window.open('', title, WINDOW_PARAMS + "dependent=yes, top=" + (screen.height / 2 - 400) + ",left=" + (screen.width / 2 - screen.width / 3));

        this.win.document.writeln(
            '<html><head><title>' + title + '</title>' +
            '<link rel="stylesheet" href="css/styles.css"/>' +
            '<link rel = "stylesheet" href = "css/neonColors.css"/>' +
            '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">' +
            '<link rel="preconnect" href="https://fonts.googleapis.com">' +
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
            '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;700&display=swap" rel="stylesheet"></head>' +
            '<body id="pop-body" class="scrollbar-primary"></body></html>');

        this.win.addEventListener('beforeunload', dockCallback);
    }
}

export { PopWindow, createPopWindow, removePopWindow, closePopWindows };