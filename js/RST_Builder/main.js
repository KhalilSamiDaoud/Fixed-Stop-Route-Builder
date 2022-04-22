import * as Config from '../configuration.js';
import * as Modal from '../modal.js';
import * as Tooltip from '../tooltips.js';
import * as SideNav from '../sideNav.js';
import * as Preloader from '../preloader.js';
import * as Maps from './rstMaps.js';
import * as StationToolbox from './stationToolbox.js';
import * as RSTBuilder from './rstBuilder.js'


//testing data - replace these imports with API scripts
import * as APIInput from './testInput.js';
import * as APIOutput from './testOutput.js';

async function main() {
    await Config.loadConfig();
    Modal.initModals();
    SideNav.initSideNav();
    Tooltip.initTooltips();

    if (Config.envVars.enviorment.useTestData)
        await APIInput.loadAllTestData();
    else
        await APIInput.loadAllAPIData();

    Maps.initMaps(
        Config.envVars.enviorment.mapCenter,
        Config.envVars.enviorment.mapZoom
    );
    StationToolbox.initToolbox();
    RSTBuilder.initRSTbuilder();

    Preloader.removePreLoader();
    APIOutput.startListening();
}

main();