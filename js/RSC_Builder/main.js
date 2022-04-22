import './rscContextMenu.js';

import * as Config from '../configuration.js';
import * as Modal from '../modal.js';
import * as Tooltip from '../tooltips.js';
import * as SideNav from '../sideNav.js';
import * as Preloader from '../preloader.js';
import * as RSTtoolbox from './rstToolBox.js';
import * as RouteBuilder from './routeBuilder.js';
import * as RouteDetails from './routeDetails.js';
import * as RouteMap from './routeMap.js';

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

    RouteMap.initMap(
        Config.envVars.enviorment.mapCenter,
        Config.envVars.enviorment.mapZoom
    );
    RouteDetails.initRouteDetails();
    RSTtoolbox.initToolbox();
    RouteBuilder.initRouteBuilder();
    Preloader.removePreLoader();

    APIOutput.startListening();
}

main();