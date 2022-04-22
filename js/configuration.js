var envVars;

function loadConfig() {
    return new Promise((resolve, reject) => {
        fetch('../config/CONFIG_env.json')
            .then(response => {
                return response.json();
            })
            .then(data => { 
                envVars = data;
                resolve();
            })
            .catch((err) => {
                console.warn('Error loading global configuration file. Check: config/CONFIG_env.json');
                console.error(err);
                reject();
            });
    });
}

function loadStyleSheet(id) {
    let sheet = document.createElement('link');

    sheet.setAttribute('href', ('../css/' + id + '.css'));
    sheet.setAttribute('rel', 'stylesheet');
    sheet.setAttribute('id', (id + '_css'));

    document.head.appendChild(sheet);
}

export { loadConfig, loadStyleSheet, envVars };