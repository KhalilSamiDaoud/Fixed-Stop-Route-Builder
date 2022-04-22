import { stopSVG, hubSVG, virtualSVG, waypointSVG } from '../constants.js';
import * as Config from '../configuration.js';
import * as Station from './station.js';
import * as RST from './rst.js';

if (!document.getElementById('gmap_css')) { Config.loadStyleSheet('gmap'); }

const ADR_SEARCH_BAR = document.getElementById('station_address_input');
const VERIFY_ADR_BTN = document.getElementById('validate_address');
const IS_VERIFIED_ELEM = document.getElementById('address_is_valid');

const mapRouteEntries = new Map();
const directionsService = new google.maps.DirectionsService();
const geocoder = new google.maps.Geocoder();

let map, stationMap, area, zoom, stationMapData, autoComplete, currRoute;

function initMaps(initArea, initZoom) {
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
        tilt: 77.5,
        mapId: '28df2216bb182507'
    });

    stationMap = new google.maps.Map(document.getElementById('station_form_map'), {
        center: area,
        navigationControl: false,
        disableDefaultUI: true,
        draggableCursor: 'default',
        scrollwheel: true,
        gestureHandling: 'greedy',
        draggable: true,
        focusable: true,
        zoom: (zoom + 1),
        tilt: 0,
        mapId: '28df2216bb182507',
        mapTypeId: 'roadmap'
    });

    const buttons = [
        ["rotate_left", "rotate", 20, google.maps.ControlPosition.BOTTOM_CENTER],
        ["rotate_right", "rotate", -20, google.maps.ControlPosition.BOTTOM_CENTER],
        ["swipe_down_alt", "tilt", 20, google.maps.ControlPosition.BOTTOM_CENTER],
        ["swipe_up_alt", "tilt", -20, google.maps.ControlPosition.BOTTOM_CENTER],
        ["map", "map", 0, google.maps.ControlPosition.BOTTOM_CENTER],
        ["filter_center_focus", "center", 0, google.maps.ControlPosition.BOTTOM_CENTER]
    ];

    buttons.forEach(([text, mode, amount, position]) => {
        const controlDiv = document.createElement("div");
        const controlUI = document.createElement("button");

        controlUI.classList.add("map-control-button", "material-icons");
        controlUI.innerText = text;
        controlUI.addEventListener("click", () => {
            adjustMap(mode, amount);
        });
        controlDiv.appendChild(controlUI);
        map.controls[position].push(controlDiv);
    });

    const adjustMap = function (mode, amount) {
        switch (mode) {
            case ('tilt'):
                map.setTilt(map.getTilt() + amount);
                break;
            case ('rotate'):
                map.setHeading(map.getHeading() + amount);
                break;
            case ('map'):
                let mode = map.getMapTypeId();
                (mode === google.maps.MapTypeId.SATELLITE) ? map.setMapTypeId(google.maps.MapTypeId.ROADMAP) : map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
                break;
            case ('center'):
                map.setCenter(area);
                break;
            default:
                break;
        }
    };

    const toggleTerrain = function () {
        let mode = stationMap.getMapTypeId();

        (mode === google.maps.MapTypeId.SATELLITE) ? stationMap.setMapTypeId(google.maps.MapTypeId.ROADMAP) : stationMap.setMapTypeId(google.maps.MapTypeId.SATELLITE);
    }

    const terrainToggle = document.createElement('div');
    const toggleUI = document.createElement('a');
    toggleUI.classList.add('map-control-button', 'material-icons');
    toggleUI.innerText = 'map';
    toggleUI.addEventListener("click", toggleTerrain);
    terrainToggle.appendChild(toggleUI);
    stationMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(terrainToggle);

    // if places API is enabled this can be used
    //autoComplete = new google.maps.places.Autocomplete(ADR_SEARCH_BAR);

    stationMapData = new StationMap();

    initRSTmapEntries();
}

function getMap() { return map; }

function getStationMap() { return stationMap };

function initRSTmapEntries() {
    RST.getRSTs().forEach(rst => {
        addRSTmapEntry(rst);
    });
}

function addRSTmapEntry(rst) {
    mapRouteEntries.set(rst.id, new RouteMapEntry(rst));

    return mapRouteEntries.get(rst.id);
}

function getRSTmapEntry(rstID) {
    return mapRouteEntries.get(rstID);
}

function setMapRoute(rst, focusLocation=false) {
    getRSTmapEntry(rst.id).plotRoute(focusLocation);
}

function clearMapRoute() {
    currRoute.hideRoute();
}

class RouteMapEntry {
    constructor(rst) {
        this.rst = rst;
        this.markers = [];

        this.directionsRenderer = new google.maps.DirectionsRenderer({
            draggable: true,
            preserveViewport: true,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: this.rst.color.hex,
                strokeOpacity: 0.6,
                strokeWeight: 5
            }
        });

        this.directionsRenderer.addListener('directions_changed', this.#handleDirectionsChange.bind(this));
    }

    plotRoute(focusLocation=false) {
        if (this.rst.stations.length === 0) {
            if (currRoute) currRoute.hideRoute();
            currRoute = this;
            return;
        }

        let bounds = new google.maps.LatLngBounds();
        let stops = [];
        let finishedStopList = [];
        let tempMarkers = [];

        this.rst.stations.forEach( station => {
            station.wayPoints.forEach( waypoint => {
                waypoint.icon = 'waypoint_icon';
                stops.push(waypoint);
            });

            stops.push(Station.getStation(station.id));
        });

        finishedStopList = stops.map( station => {
            let loc = { lat: station.lat, lng: station.lng };

            bounds.extend(loc);

            tempMarkers.push( new google.maps.Marker({
                position: loc,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(this.#getIconType(station)),
                    scaledSize: new google.maps.Size(38, 38),
                    anchor: new google.maps.Point(19, 38),
                },
                map: map
            }));

            return {
                location: loc,
                stopover: (station.icon !== 'waypoint_icon') ? true : false
            };
        });

        directionsService.route({
                origin: finishedStopList[0].location,
                destination: finishedStopList[finishedStopList.length-1].location,
                waypoints: finishedStopList.slice(1, -1),
                travelMode: google.maps.TravelMode.DRIVING,
                avoidTolls: true,
                avoidFerries: true
            })
            .then((result) => {
                this.directionsRenderer.setDirections(result);
                if (currRoute) currRoute.hideRoute();
                this.directionsRenderer.setMap(map);

                if (focusLocation) {
                    map.fitBounds(bounds);
                    map.setTilt(57.5);
                }

                this.markers.forEach(marker => { marker.setMap(null)});
                this.markers = tempMarkers;
                currRoute = this;
            })
            .catch((e) => {
                console.error("Could not display directions due to: " + e);
                if (currRoute) currRoute.hideRoute();
                currRoute = this;
            });
    }

    hideRoute() {
        this.directionsRenderer.setMap(null);
        this.markers.forEach(marker => { marker.setMap(null)});
        this.markers = [];
    }

    #getIconType(station) {
        switch(station.icon) {
            case('virtual_icon'):
            case('request_icon'):
                return virtualSVG.replaceAll('{{ color }}', station.color.hex);
            case('waypoint_icon'):
                return waypointSVG.replaceAll('{{ color }}', '#00C853');
            case('hub_icon'):
                return hubSVG.replaceAll('{{ color }}', station.color.hex);
            case('station_icon'):
            default:
                return stopSVG.replaceAll('{{ color }}', station.color.hex);
        }
    }

    #handleDirectionsChange() {
        const directions = this.directionsRenderer.getDirections();

        for (let i=0; i < directions.routes[0].legs.length; i++) {
            if (!directions.routes[0].legs[i].via_waypoints.length) continue;

            let tempWaypoints = directions.routes[0].legs[i].via_waypoints.map( waypoint => {
                this.#addWaypointMarker(waypoint);

                return {
                    lat: waypoint.lat(),
                    lng: waypoint.lng()
                }
            });

            this.rst.addWayPoints(tempWaypoints, (i + 1));
        }
    }

    #addWaypointMarker(waypoint) {
        this.markers.push( new google.maps.Marker({
            position: {lat: waypoint.lat(), lng: waypoint.lng()},
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(waypointSVG.replaceAll('{{ color }}', '#00C853')),
                scaledSize: new google.maps.Size(38, 38),
                anchor: new google.maps.Point(19, 38),
            },
            map: map
        }));
    }
}

class StationMap {
    constructor() {
        VERIFY_ADR_BTN.addEventListener('click', this.#codeAddress.bind(this));

        stationMap.addListener('click', this.#geocodeLatLng.bind(this));
    }

    #currLatLng = null;
    #currAddress = null;
    #geocodeMarker = null;
    isValid = false;

    getAddress() { return this.#currAddress; }

    getLatLng() { return this.#currLatLng; }

    #codeAddress() {
        geocoder.geocode( { 'address': ADR_SEARCH_BAR.value}, function(results, status) {
            if (status == 'OK') {
                stationMap.setCenter(results[0].geometry.location);
                if (this.#geocodeMarker) this.#geocodeMarker.setMap(null);
                this.#geocodeMarker = new google.maps.Marker({
                    map: stationMap,
                    position: results[0].geometry.location
                });

                this.#currAddress = (
                    results[0].address_components[0].long_name + ' ' +
                    results[0].address_components[1].short_name + ', ' +
                    results[0].address_components[2].long_name + ', ' +
                    results[0].address_components[4].short_name
                );
                this.#currLatLng = {
                    lat: results[0].geometry.location.lat(), 
                    lng: results[0].geometry.location.lng()
                };
                this.isValid = true;

                IS_VERIFIED_ELEM.firstElementChild.innerText = 'done';
                IS_VERIFIED_ELEM.classList.add('valid');
                IS_VERIFIED_ELEM.classList.remove('invalid');
            } 
            else {
                this.#setInvalid();
                IS_VERIFIED_ELEM.firstElementChild.innerText = 'close';
                IS_VERIFIED_ELEM.classList.remove('valid');
                IS_VERIFIED_ELEM.classList.add('invalid');
            }
        }.bind(this));
    }
    
    #geocodeLatLng(e) {
        geocoder.geocode({ location: e.latLng })
            .then((response) => {
                if (response.results[0]) {
                    if (this.#geocodeMarker) this.#geocodeMarker.setMap(null);
                    this.#geocodeMarker = new google.maps.Marker({
                        position: e.latLng,
                        map: stationMap,
                    });

                    this.#currAddress = (
                        response.results[0].address_components[0].long_name + ' ' +
                        response.results[0].address_components[1].short_name + ', ' +
                        response.results[0].address_components[2].long_name + ', ' +
                        response.results[0].address_components[4].short_name
                    );
                    this.#currLatLng = {
                        lat: response.results[0].geometry.location.lat(), 
                        lng: response.results[0].geometry.location.lng()
                    };
                    this.isValid = true;
    
                    ADR_SEARCH_BAR.value = this.#currAddress;
                    IS_VERIFIED_ELEM.firstElementChild.innerText = 'done';
                    IS_VERIFIED_ELEM.classList.add('valid');
                    IS_VERIFIED_ELEM.classList.remove('invalid');
                } 
                else {
                    this.#setInvalid();
                    IS_VERIFIED_ELEM.firstElementChild.innerText = 'close';
                    IS_VERIFIED_ELEM.classList.remove('valid');
                    IS_VERIFIED_ELEM.classList.add('invalid');
                    }
            })
            .catch((e) => {
                    console.warn('reverse geocoding failed: ' + e);
                
                    this.#setInvalid();
                    IS_VERIFIED_ELEM.firstElementChild.innerText = 'close';
                    IS_VERIFIED_ELEM.classList.remove('valid');
                    IS_VERIFIED_ELEM.classList.add('invalid');

                    this.resetAddressSearch();
            });
    }

    #setInvalid() {
        this.#currAddress = null;
        this.#currLatLng = null
        this.isValid = false;
        this.#geocodeMarker?.setMap(null);
    }

    resetAddressSearch() {
        this.#setInvalid();

        stationMap.setCenter(area);
        ADR_SEARCH_BAR.value = '';
        IS_VERIFIED_ELEM.firstElementChild.innerText = 'question_mark';
        IS_VERIFIED_ELEM.classList.remove('valid');
        IS_VERIFIED_ELEM.classList.remove('invalid');
    }

    setAddressSearch(address, latlng) {
        stationMap.setCenter(latlng);
        ADR_SEARCH_BAR.value = address;
        IS_VERIFIED_ELEM.firstElementChild.innerText = 'done';
        IS_VERIFIED_ELEM.classList.add('valid');
        IS_VERIFIED_ELEM.classList.remove('invalid');

        if (this.#geocodeMarker) this.#geocodeMarker.setMap(null);
        this.#geocodeMarker = new google.maps.Marker({
            position: latlng,
            map: stationMap,
        });

        this.#currLatLng = latlng;
        this.#currAddress = address;
        this.isValid = true;
    }
}

export { initMaps, initRSTmapEntries, getMap, getStationMap, addRSTmapEntry, 
        clearMapRoute, getRSTmapEntry, setMapRoute, stationMapData };