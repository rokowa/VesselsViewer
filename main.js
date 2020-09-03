import 'ol/ol.css';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Map, View, Overlay } from 'ol';
import { Tile as TileLayer } from 'ol/layer';
import { Vector as VectorSource, OSM } from 'ol/source';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';

import { Select, DragBox } from 'ol/interaction';
import { click, platformModifierKeyOnly } from 'ol/events/condition';
import { Control } from 'ol/control';

import { getCenter, getSize } from 'ol/extent';

import io from 'socket.io-client';

class Grid {
    constructor(x, y, squareSize, lineWidth, color) {
        this.x = lineWidth % 2 === 0 ? x : x + 0.5; //Solve blurry line
        this.y = lineWidth % 2 === 0 ? y : y + 0.5;
        this.squareSize = squareSize;
        this.lineWidth = lineWidth;
        this.color = color;

        this.shots = [];
    }

    getSize() {
        return 11 * this.squareSize + 12 * this.lineWidth;
    }

    coordCanvasToSquare(x, y) {
        let sqX = Math.floor((x - this.x) / (this.squareSize + this.lineWidth));
        let sqY = Math.floor((y - this.y) / (this.squareSize + this.lineWidth));
        if (sqX < 1 || sqX > 10 || sqY < 1 || sqY > 10) {
            return null;
        } else {
            return [sqX, sqY];
        }
    }

    coordSquareToCanvas(x, y) {
        if (x > 0 && x < 11 && y > 0 && y < 11) {
            return [
                Math.ceil(this.x) + x * (this.squareSize + this.lineWidth),
                Math.ceil(this.y) + y * (this.squareSize + this.lineWidth),
            ];
        } else {
            return null;
        }
    }

    draw(ctx) {
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        ctx.font = `${Math.ceil(this.squareSize * 0.6)}px Arial`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        const size = this.getSize();
        for (let i = 0; i < 12; i++) {
            let offset = i * (this.squareSize + this.lineWidth);
            ctx.beginPath();
            ctx.moveTo(this.x + offset, this.y);
            ctx.lineTo(this.x + offset, this.y + size);
            ctx.moveTo(this.x, this.y + offset);
            ctx.lineTo(this.x + size, this.y + offset);
            ctx.closePath();
            ctx.stroke();
            if (i > 0 && i < 11) {
                ctx.fillText(
                    String.fromCharCode(64 + i),
                    this.x + offset + this.squareSize / 2,
                    this.y + this.squareSize / 2
                );
                ctx.fillText(
                    i,
                    this.x + this.squareSize / 2,
                    this.y + offset + this.squareSize / 2
                );
            }
        }
    }
}

class Ship {
    constructor(x, y, length, orientation) {
        if (!Ship.validDimension(x, y, length, orientation)) {
            throw `Invalid dimension : ${x}, ${y}, ${length}`;
        }

        this.pos = [];
        for (let i = 0; i < length; i++) {
            if (orientation === 'vertical') {
                this.pos.push({
                    x: x,
                    y: y + i,
                    hit: false,
                });
            } else if (orientation === 'horizontal') {
                this.pos.push({
                    x: x + i,
                    y: y,
                    hit: false,
                });
            } else {
                throw `Invalid orientation : ${orientation}`;
            }
        }

        this.orientation = orientation;
        this.sunk = false;
    }

    static validDimension(x, y, length, orientation) {
        return !(
            x < 1 ||
            x > 10 ||
            y < 1 ||
            y > 10 ||
            (orientation === 'vertical' && y + length - 1 > 10) ||
            (orientation === 'horizontal' && x + length - 1 > 10)
        );
    }

    overlap(ship) {
        return this.pos.some(p1 => {
            return ship.pos.some(p2 => p1.x === p2.x && p1.y === p2.y);
        });
    }

    isAt(x, y) {
        return this.pos.some(p => p.x === x && p.y === y);
    }

    hit(x, y) {
        return this.pos.some(p => {
            if (p.x === x && p.y === y) {
                p.hit = true;
                if (this.pos.every(p => p.hit)) {
                    this.sunk = true;
                }
                return true;
            } else {
                return false;
            }
        });
    }

    draw(ctx, grid) {
        ctx.lineWidth = 4;
        const r = grid.squareSize / 2 - 4;
        if (this.sunk) {
            ctx.fillStyle = '#aa0000';
            ctx.strokeStyle = '#550000';
        } else {
            ctx.fillStyle = '#aaaaaa';
            ctx.strokeStyle = '#555555';
        }
        let [xBegin, yBegin] = grid.coordSquareToCanvas(
            this.pos[0].x,
            this.pos[0].y
        );
        xBegin += grid.squareSize / 2;
        yBegin += grid.squareSize / 2;
        let [xEnd, yEnd] = grid.coordSquareToCanvas(
            this.pos[this.pos.length - 1].x,
            this.pos[this.pos.length - 1].y
        );
        xEnd += grid.squareSize / 2;
        yEnd += grid.squareSize / 2;
        if (this.orientation === 'vertical') {
            let startAngle = Math.PI;
            let endAngle = 2 * Math.PI;

            ctx.beginPath();
            ctx.arc(xBegin, yBegin, r, startAngle, endAngle);
            ctx.lineTo(xEnd + r, yEnd);
            ctx.arc(xEnd, yEnd, r, endAngle, startAngle);
            ctx.lineTo(xBegin - r, yBegin);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        } else if (this.orientation === 'horizontal') {
            let startAngle = 0.5 * Math.PI;
            let endAngle = 1.5 * Math.PI;

            ctx.beginPath();
            ctx.arc(xBegin, yBegin, r, startAngle, endAngle);
            ctx.lineTo(xEnd, yEnd - r);
            ctx.arc(xEnd, yEnd, r, endAngle, startAngle);
            ctx.lineTo(xBegin, yBegin + r);
            ctx.closePath();
            ctx.stroke();
            ctx.fill();
        } else {
            throw `Unknown orientation : ${ship.orientation}`;
        }
    }
}

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

// const dragBox = new DragBox({
//     condition: platformModifierKeyOnly,
// });
// dragBox.on('boxend', e => {
//     console.log(dragBox.getGeometry().getExtent());
// });

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
// map.addInteraction(dragBox);

function countVessels(grid, offset) {
    const count = Array(10)
        .fill()
        .map(() => Array(10).fill(0));
    const pixels = steadySource
        .getFeatures()
        .concat(movingSource.getFeatures())
        .map(f => {
            return map.getPixelFromCoordinate(f.getGeometry().getCoordinates());
        });
    let loopCount = 0;
    pixels.forEach(p => {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                loopCount++;
                let topLeft = grid.coordSquareToCanvas(i + 1, j + 1);
                if (
                    p[0] >= topLeft[0] + offset[0] &&
                    p[0] <= topLeft[0] + grid.squareSize + offset[0] &&
                    p[1] >= topLeft[1] + offset[1] &&
                    p[1] <= topLeft[1] + grid.squareSize + offset[1]
                ) {
                    count[i][j]++;
                }
            }
        }
    });
    return count;
}

const divMap = document.getElementById('map');
// const divViewport = document.querySelector('.ol-viewport');
const canvasGrid = document.createElement('canvas');
canvasGrid.style.pointerEvents = 'none';
const ctx = canvasGrid.getContext('2d');
const grid = new Grid(0, 0, 50, 1, 'black');
const size = grid.getSize();
canvasGrid.width = size;
canvasGrid.height = size;
canvasGrid.style.position = 'relative';
canvasGrid.style.top = '50%';
canvasGrid.style.left = '50%';
canvasGrid.style.transform = 'translate(-50%, -50%)';

grid.draw(ctx);

const controlGrid = new Control({
    element: canvasGrid,
});
map.addControl(controlGrid);

// divMap.addEventListener('mousemove', event => {
//     const x = event.clientX;
//     const y = event.clientY;
//     console.log(`(${x}, ${y}), (${map.getCoordinateFromPixel([x, y])})`);
// });

// const divLog = document.createElement('div');
// divLog.id = 'log';
// document.body.appendChild(divLog);
// divLog.innerHTML = `${divMapRect.left}, ${divMapRect.top}<br>${canvasGridRect.left}, ${canvasGridRect.top}<br>${offset[0]}, ${offset[1]}`;

// map.on('rendercomplete', event => {
//     console.log(countVessels([100, 100], [400, 400]));
// });
map.on('rendercomplete', event => {
    const divMapRect = divMap.getBoundingClientRect();
    const canvasGridRect = canvasGrid.getBoundingClientRect();
    const offset = [
        canvasGridRect.left - divMapRect.left,
        canvasGridRect.top - divMapRect.top,
    ];
    // const count = countVessels(grid, offset);
    const count = countVessels(grid, offset);
    const t_count = count[0].map((_, colIndex) =>
        count.map(row => row[colIndex])
    );
    const vessels = [];
    for (let n of [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]) {
        let best = null;
        for (let i = 0; i < count.length; i++) {
            let sub = max_subarray(count[i], n);
            if (best === null) {
                best = {
                    orientation: 'vertical',
                    sum: sub.sum,
                    x: i + 1,
                    y: sub.start + 1,
                };
            } else if (sub.sum > best.sum) {
                best.sum = sub.sum;
                best.x = i + 1;
                best.y = sub.start + 1;
            }
        }
        for (let i = 0; i < t_count.length; i++) {
            let sub = max_subarray(t_count[i], n);
            if (sub.sum > best.sum) {
                best.orientation = 'horizontal';
                best.sum = sub.sum;
                best.x = sub.start + 1;
                best.y = i + 1;
            }
        }
        let ship = new Ship(best.x, best.y, n, best.orientation);
        vessels.push(ship);
        ship.pos.forEach(p => {
            count[p.x - 1][p.y - 1] = 0;
            t_count[p.y - 1][p.x - 1] = 0;
        });
    }
    // for (let i = 0; i < count.length; i++) {
    //     let subarray = max_subarray(count[i], 4);
    //     vessels.push(new Ship(i + 1, subarray.start + 1, 4, 'vertical'));
    // }
    ctx.clearRect(0, 0, canvasGrid.width, canvasGrid.height);
    grid.draw(ctx);
    vessels.forEach(v => v.draw(ctx, grid));
    // for (let i = 0; i < 10; i++) {
    //     for (let j = 0; j < 10; j++) {
    //         ctx.textAlign = 'center';
    //         ctx.textBaseline = 'middle';
    //         let coord = grid.coordSquareToCanvas(i + 1, j + 1);
    //         ctx.fillText(
    //             count[i][j],
    //             coord[0] + grid.squareSize / 2,
    //             coord[1] + grid.squareSize / 2
    //         );
    //     }
    //}
});

//https://en.wikipedia.org/wiki/Maximum_subarray_problem#Kadane%27s_algorithm
function max_subarray(numbers, length) {
    let bestSum = 0;
    for (let i = 0; i < length; i++) {
        bestSum += numbers[i];
    }
    let currentSum = bestSum;
    let bestStart = 0;
    for (let i = length; i < numbers.length; i++) {
        currentSum += numbers[i] - numbers[i - length];
        if (currentSum > bestSum) {
            bestSum = currentSum;
            bestStart = i - length + 1;
        }
    }
    return {
        sum: bestSum,
        start: bestStart,
    };
}

function generateVessels(count) {}
// console.log(grid.coordSquareToCanvas(1, 1));
// console.log(offset);
// console.log(countVessels([100, 100], [400, 400]));
