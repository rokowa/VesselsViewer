import 'ol/ol.css';

//Map is the core component
import {
    Map as olMap,
    View as olView,
    Feature as olFeature,
    Overlay as olOverlay,
} from 'ol';
import { fromLonLat as olFromLonLat } from 'ol/proj';

import { Vector as olVectorSource, OSM as olOSM } from 'ol/source';
import { Vector as olVectorLayer, Tile as olTileLayer } from 'ol/layer';

import { Point as olPoint } from 'ol/geom';

import { Select as olSelect } from 'ol/interaction';
import { click as olConditionClick } from 'ol/events/condition';

import socket_io from 'socket.io-client';

class Vessels {
    /* Handle vessels containers objects for openlayer and connexion with the server */

    constructor() {
        /* Source objects, they contains features, each feature is a vessel
         * Because of WebGLPointLayer, we need 2 layers with 2 different style
         * to have a different symbol */
        const steadyStyle = {
            symbol: {
                symbolType: 'circle',
                size: 15,
                color: '#11965A',
                rotateWithView: false,
                offset: [0, 0],
            },
        };
        const movingStyle = {
            symbol: {
                symbolType: 'triangle',
                size: ['array', 15, 30],
                color: '#11965A',
                rotateWithView: true,
                rotation: ['get', 'HEADING'],
                stroke: {
                    color: 'black',
                    width: 5,
                },
            },
        };
        this.steadySource = new olVectorSource({
            style: steadyStyle,
        });
        this.movingSource = new olVectorSource({
            style: movingStyle,
        });

        /* Layers displays features on top of the map */
        this.steadyLayer = new olVectorLayer({
            source: this.steadySource,
        });
        this.movingLayer = new olVectorLayer({
            source: this.movingLayer,
        });

        this.socket = null;
    }

    dataToSources(data) {
        /* Data is the parsed json received from the server :
         * data = [ {..., RECORDS: numbers of vessels},
                    [  {NAME:..., HEADING:..., ...},
                       {...},
                       ...
                    ]
                  ]
         * we populate either steadySource or movingSource depending
         * of the avaiability of the COG (or HEADING) property
         */
        // console.log(`Received from the server : ${data[0].RECORDS} vessels`);
        const steady = [];
        const moving = [];
        data[1].forEach(v => {
            /* HEADING is the orientation of the ship, 511 means not available
             * we keep in as a properties to access it in the style :
             * https://openlayers.org/en/latest/examples/webgl-points-layer.html */
            const heading = parseInt(v.HEADING);
            const feature = new olFeature({
                vessel: v,
                HEADING: parseInt(v.HEADING),
                geometry: new olPoint(olFromLonLat([v.LONGITUDE, v.LATITUDE])),
            });
            if (heading === 511) {
                steady.push(feature);
            } else {
                moving.push(feature);
            }
        });
        this.steadySource.clear();
        this.steadySource.addFeatures(steady);
        this.movingSource.clear();
        this.movingSource.addFeatures(moving);
    }

    connect() {
        /* with no argument : should connect directly with origin server */
        this.socket = socket_io();
        /* when the event vessels is triggered, parse the data as json and call dataToSources */
        this.socket.on('vessels', textData => {
            const data = JSON.parse(textData);
            console.log(`${data[0].RECORDS} vessels received`); //Always useful
            this.dataToSources(data);
        });
    }

    addToMap(map) {
        map.addLayer(this.steadyLayer);
        map.addLayer(this.movingLayer);
    }
}

class Popup {
    constructor(element) {
        /* An overlay is display on top of the map and is linked to a coordinate,
         * so it moves with the map */
        this.overlay = new olOverlay({
            element: element,
            position: undefined,
            positioning: 'bottom-center',
            autoPan: {
                animation: {
                    duration: 250,
                },
                margin: 20,
            },
        });

        this.selected = null;
        this.contentElement = element.getElementByClassName('popupContent');

        this.select = new olSelect({
            condition: olConditionClick,
        });
        this.select.on('select', e => {
            this.open();
        });

        const popupCloser = element.getElementByClassName('popupCloser');
        popupCloser.addEventListener('click', e => {
            this.close();
            popupCloser.blur();
            return false;
        });
    }

    open() {
        const features = this.select.getFeatures();
        if (features.getLength() > 0) {
            const feature = features.item(0);
            if (this.selected !== feature) {
                this.selected = feature;
                const vessel = feature.get('vessel');
                this.contentElement.innerHTML = `${vessel.NAME}`;
                this.overlay.setPosition(
                    olFromLonLat([vessel.LONGITUDE, vessel.LATITUDE])
                );
            }
        } else if (this.selected !== null) {
            closePopup();
        }
    }

    close() {
        this.overlay.setPosition(undefined);
        this.selected = null;
        this.select.getFeatures().clear();
    }

    addToMap(map) {
        map.addOverlay(this.overlay);
        map.addInteraction(this.select);
    }
}

class Map {
    constructor(element) {
        this.olMap = new olMap({
            target: element,
            layers: [
                new olTileLayer({
                    source: new olOSM(),
                }),
            ],
            view: new olView({
                center: olFromLonLat([3.076171875, 51.580483198305345]),
                zoom: 8,
            }),
        });
    }
}

export { Map, Vessels, Popup };
