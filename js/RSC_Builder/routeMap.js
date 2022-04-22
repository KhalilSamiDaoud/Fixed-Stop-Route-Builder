import { stopSVG, hubSVG, virtualSVG } from '../constants.js';
import * as Config from '../configuration.js';
import * as Station from './station.js';
import * as Route from './route.js';

if (!document.getElementById('gmap_css')) { Config.loadStyleSheet('gmap'); }

const mapRouteEntries = new Map();

let map, area, zoom, currRouteMap;

function initMap(initArea, initZoom) {
    if (!area && !zoom) {
        area = initArea;
        zoom = initZoom;
    }

    map = new google.maps.Map(document.getElementById('map'), {
        center: area,
        navigationControl: false,
        disableDefaultUI: true,
        draggableCursor: 'default',
        scrollwheel: true,
        gestureHandling: 'greedy',
        draggable: true,
        focusable: true,
        zoom: zoom,
        tilt: 57.5,
        mapId: '28df2216bb182507'
    });

    initMapRouteEntries();
}

function initMapRouteEntries() {
    Route.getRoutes().forEach(route => {
        addMapRouteEntry(route);
    });
}

function addMapRouteEntry(route) {
    mapRouteEntries.set(route.id, new RouteMapEntry(route));
}

function getMapRoutes() {
    return mapRouteEntries;
}

function getMapRoute(RouteID) {
    return mapRouteEntries.get(RouteID);
}

function removeRouteMap(RouteID) {
    mapRouteEntries.remove(RouteID);
}

function clearRouteMaps() {
    mapRouteEntries.forEach(entry => {
        entry.destroy();
    });

    mapRouteEntries.clear();
}

class RouteMapEntry {
    constructor(route) {
        this.route = route;
        this.currRSC = null;

        this.mapRoutes = new Map(); //key: rsc.id, val: ConfigurationSegment;

        this.#constructSegments();
    }

    update() {
        this.mapRoutes.forEach( entry => {
            entry.destroy();
        });
        this.mapRoutes.clear();

        this.#constructSegments();

        if (currRouteMap === this && this.currRSC) {
            if (this.mapRoutes.get(this.currRSC.id))
                this.setRSC(this.currRSC);
            else
                this.setDefault();
        }
        if (currRouteMap === this && !this.currRSC)
            this.setDefault();
    }

    destroy() {
        this.mapRoutes.forEach( entry => {
            entry.destroy();
        });
        this.mapRoutes.clear();

        removeRouteMap(this.route.id);
    }

    setDefault() {
        let targetRSC = [...this.mapRoutes.values()][0]?.rsc;
        currRouteMap = this;

        if (!targetRSC) return;
        this.currRSC = targetRSC;

        this.setRSC(targetRSC);
    }

    setRSC(rsc) {
        this.setMarkers(rsc);
        this.setPath(rsc);

        map.fitBounds(this.mapRoutes.get(rsc.id).bounds);
        map.setTilt(57.5);

        this.currRSC = rsc;
        currRouteMap = this;
    }

    setMarkers(rsc) {
        this.mapRoutes.get(rsc.id).setMarkers();
    }

    setPath(rsc) {
        this.mapRoutes.get(rsc.id).setPath();
    }

    hideRSC(rsc=null) {
        if (this.currRSC === null) return;
        if (rsc === null) rsc = this.currRSC;
        this.currRSC = null;

        this.hideMarkers(rsc);
        this.hidePath(rsc);
    }

    hideMarkers(rsc) {
        this.mapRoutes.get(rsc.id).hideMarkers();
    }

    hidePath(rsc) {
        this.mapRoutes.get(rsc.id).hidePath();
    }

    #constructSegments() {
        this.route.rscs.forEach( rsc => {
            this.mapRoutes.set(rsc.id, new ConfigurationSegment(rsc));
        });
    }
}

class ConfigurationSegment {
    constructor(rsc) {
        this.rsc = rsc;

        this.segments = new Map(); //key: rst.id, val: Polyline
        this.markers = new Map(); //key: rst.station.id, val: Marker
        this.bounds = new google.maps.LatLngBounds();

        this.#constructSegment();
    }

    destroy() {
        this.hideMarkers();
        this.hidePath();
    }

    setMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(map);
        });
    }

    setPath() {
        this.segments.forEach(segment => {
            segment.setMap(map);
        });
    }

    hideMarkers() {
        this.markers.forEach( marker => {
            marker.setMap(null);
        });
    }

    hidePath() {
        this.segments.forEach( segment => {
            segment.setMap(null);
        });
    }

    #constructSegment() {
        if (this.rsc.rsts.size === 0) return;

        this.rsc.rsts.forEach( rst => {
            rst.stations.forEach( station => {
                let tempStation = Station.getStation(station.id);

                this.markers.set(tempStation.id, new google.maps.Marker({
                    position: { lat: tempStation.lat, lng: tempStation.lng },
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(this.#getIconType(tempStation.icon)),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 30)
                    }
                }));

                this.bounds.extend({ lat: tempStation.lat, lng: tempStation.lng });
            });
        });

        let tempPath;

        this.rsc.rsts.forEach( rst => {
            tempPath = [];
            rst.stations.forEach( station => {
                let tempStation = Station.getStation(station.id);

                tempPath.push({ lat: tempStation.lat, lng: tempStation.lng });
            });
            tempPath.push(tempPath[0]);

            this.segments.set(rst.id, new google.maps.Polyline({
                path: tempPath,
                strokeOpacity: 0.66,
                strokeColor: rst.color.hex,
                strokeWeight: 6
            }));
        });
    }

    #getIconType(icon) {
        switch(icon) {
            case('virtual_icon'):
                return virtualSVG;
            case('station_icon'):
                return stopSVG;
            case('hub_icon'):
                return hubSVG;
            default:
                return stopSVG;
        }
    }
}

export { initMap, initMapRouteEntries, addMapRouteEntry, getMapRoutes, getMapRoute, removeRouteMap, clearRouteMaps, currRouteMap };