import 'ol/ol.css';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Map, View, Overlay } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { Vector as VectorSource, OSM } from 'ol/source';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';

import Select from 'ol/interaction/Select';
import { click } from 'ol/events/condition';

import io from 'socket.io-client';

const movingSource = new VectorSource();
const steadySource = new VectorSource();

const movingStyle = {
    symbol: {
        symbolType: 'triangle',
        size: ['array', 15, 30],
        color: '#11965A',
        rotateWithView: true,
        rotation: ['get', 'HEADING'],
    },
};
const steadyStyle = {
    symbol: {
        symbolType: 'circle',
        size: 15,
        color: '#11965A',
        rotateWithView: false,
        offset: [0, 0],
    },
};

const socket = io();
const divMessage = document.querySelector('#messages');

socket.on('vessels', textData => {
    const data = JSON.parse(textData);
    console.log(`${data[0].RECORDS} vessels received`);
    const steady = [];
    const moving = [];
    data[1].forEach(v => {
        const coord = fromLonLat([v.LONGITUDE, v.LATITUDE]);
        // const cog = parseFloat(v.COG);
        const heading = parseInt(v.HEADING);
        let feature = new Feature({
            vessel: v,
            // COG: cog,
            HEADING: heading,
            geometry: new Point(coord),
        });
        if (heading === 511) {
            steady.push(feature);
        } else {
            moving.push(feature);
        }
    });
    steadySource.clear();
    steadySource.addFeatures(steady);
    movingSource.clear();
    movingSource.addFeatures(moving);
});

// function loadData() {
//     fetch('http://127.0.0.1:3000/data.json')
//         .then(response => response.json())
//         .then(data => {
//             const steady = [];
//             const moving = [];
//             data[1].forEach(v => {
//                 const coord = fromLonLat([v.LONGITUDE, v.LATITUDE]);
//                 // const cog = parseFloat(v.COG);
//                 const heading = parseInt(v.HEADING);
//                 let feature = new Feature({
//                     vessel: v,
//                     // COG: cog,
//                     HEADING: heading,
//                     geometry: new Point(coord),
//                 });
//                 if (heading === 511) {
//                     steady.push(feature);
//                 } else {
//                     moving.push(feature);
//                 }
//             });
//             steadySource.clear();
//             steadySource.addFeatures(steady);
//             movingSource.clear();
//             movingSource.addFeatures(moving);
//         });
// }

/**********************************
 * Popup
 */
let selectedFeature = null;
const divPopup = document.querySelector('#mapPopup');
const popupContent = divPopup.querySelector('#popupContent');

const popupOverlay = new Overlay({
    element: divPopup,
    position: undefined,
    positioning: 'bottom-center',
    autoPan: {
        animation: {
            duration: 250,
        },
        margin: 20,
    },
});

function closePopup() {
    popupOverlay.setPosition(undefined);
    selectedFeature = null;
    interaction.getFeatures().clear();
}

const popupCloser = divPopup.querySelector('#popupCloser');
popupCloser.onclick = () => {
    closePopup();
    popupCloser.blur();
    return false;
};

const interaction = new Select({
    condition: click,
});
//https://openlayers.org/en/latest/apidoc/module-ol_interaction_Select-Select.html
let selectedVessel = null;

//
interaction.on('select', e => {
    // console.log(e.selected);
    const features = interaction.getFeatures();
    if (features.getLength() > 0) {
        const feature = features.item(0);
        if (selectedFeature !== feature) {
            selectedFeature = feature;
            selectedVessel = feature.get('vessel');
            //https://openlayers.org/en/latest/apidoc/module-ol_Feature-Feature.html
            popupContent.innerHTML = `${selectedVessel.NAME}`;
            popupOverlay.setPosition(
                fromLonLat([selectedVessel.LONGITUDE, selectedVessel.LATITUDE])
            );
        }
    } else {
        closePopup();
    }
});

const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM(),
        }),
        new WebGLPointsLayer({
            source: movingSource,
            style: movingStyle,
        }),
        new WebGLPointsLayer({
            source: steadySource,
            style: steadyStyle,
        }),
    ],
    overlays: [popupOverlay],
    view: new View({
        center: fromLonLat([3.076171875, 51.580483198305345]),
        zoom: 8,
    }),
});
map.addInteraction(interaction);
