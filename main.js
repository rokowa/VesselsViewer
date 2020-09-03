// import 'ol/ol.css';
// import { fromLonLat, toLonLat } from 'ol/proj';
// import { Map, View, Overlay } from 'ol';
// import { Tile as TileLayer } from 'ol/layer';
// import { Vector as VectorSource, OSM } from 'ol/source';
// import Feature from 'ol/Feature';
// import Point from 'ol/geom/Point';
// import WebGLPointsLayer from 'ol/layer/WebGLPoints';

// import { Select, DragBox } from 'ol/interaction';
// import { click, platformModifierKeyOnly } from 'ol/events/condition';
// import { Control } from 'ol/control';

// import { getCenter, getSize } from 'ol/extent';

// import io from 'socket.io-client';

import { Map, Vessels, Popup } from './viewer';

import { Control as olControl } from 'ol/control';
import { Grid as battleGrid, Ship as battleShip } from './battleship';

const divMap = document.getElementById('map');
const vessels = new Vessels();

const divPopup = document.getElementById('popup');
const popup = new Popup(divPopup);

const map = new Map(divMap);
vessels.addToMap(map.olMap);
popup.addToMap(map.olMap);

class NewGameControl {
    constructor(divMap, vessels, olMap) {
        this.divMap = divMap;

        this.divControl = document.createElement('div');
        this.divControl.className = 'newGameControl';
        this.divControl.style.pointerEvents = 'none';

        this.gridCounter = new GridCounter(
            this.divControl,
            this.divMap,
            vessels,
            olMap
        );

        this.control = new olControl({
            element: this.divControl,
        });
    }

    addToMap(map) {
        map.addControl(this.control);
    }
}

function max_subarray(numbers, length) {
    /* We search the subarray of fixed length with max sum, it's a variation of
     * Kadane's algorithm (but for fixed length)
     * https://en.wikipedia.org/wiki/Maximum_subarray_problem#Kadane%27s_algorithm */
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

class GridCounter {
    constructor(container, divMap, vessels, olMap) {
        this.container = container;
        this.divMap = divMap;
        this.vessels = vessels;
        this.olMap = olMap;

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'countGrid';
        this.ctx = this.canvas.getContext('2d');
        this.container.appendChild(this.canvas);

        this.grid = null;

        olMap.on('rendercomplete', e => {
            this.draw();
        });

        window.addEventListener('resize', e => {
            this.draw();
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawShips(this.generateShip());
    }

    drawGrid() {
        const rect = this.divMap.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        const squareSize = Math.floor((size * 0.8) / 11);
        this.grid = new battleGrid(0, 0, squareSize, 1, 'black');
        const gridSize = this.grid.getSize();
        this.canvas.width = gridSize;
        this.canvas.height = gridSize;
        this.grid.draw(this.ctx);
    }

    drawShips(ships) {
        if (this.grid !== null) {
            ships.forEach(s => {
                s.draw(this.ctx, this.grid);
            });
        }
    }

    generateShip() {
        /* Generate a 10x10 array filled with 0 */
        const count = Array(10)
            .fill()
            .map(() => Array(10).fill(0));
        const canvasRect = this.canvas.getBoundingClientRect();
        const divMapRect = this.divMap.getBoundingClientRect();
        const offset = {
            x: canvasRect.x - divMapRect.x,
            y: canvasRect.y - divMapRect.y,
        };
        /* Get all features, iterate and get position in pixels */
        this.vessels.steadySource
            .getFeatures()
            .concat(this.vessels.movingSource.getFeatures())
            .forEach(f => {
                const p = this.olMap.getPixelFromCoordinate(
                    f.getGeometry().getCoordinates()
                );
                /* We iterate for all squares in the grid to see in which the pixel is */
                for (let i = 0; i < 10; i++) {
                    for (let j = 0; j < 10; j++) {
                        // loopCount++;
                        let topLeft = this.grid.coordSquareToCanvas(
                            i + 1,
                            j + 1
                        );
                        if (
                            p[0] >= topLeft[0] + offset.x &&
                            p[0] <=
                                topLeft[0] + this.grid.squareSize + offset.x &&
                            p[1] >= topLeft[1] + offset.y &&
                            p[1] <= topLeft[1] + this.grid.squareSize + offset.y
                        ) {
                            count[i][j]++;
                        }
                    }
                }
            });
        /* Transpose count */
        const t_count = count[0].map((_, colIndex) =>
            count.map(row => row[colIndex])
        );
        const ships = [];
        /* According to wiki : the belgian version of battleship has
         * 1 ship of 4 square, 2 of 3, 3 of 2 and 4 of 1 */
        for (let n of [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]) {
            /* For each ship we search the one which cover the maximum of "real" ships */
            let best = null;
            for (let i = 0; i < count.length; i++) {
                /* We search in vertical */
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
                /* We search in horizontal */
                let sub = max_subarray(t_count[i], n);
                if (sub.sum > best.sum) {
                    best.orientation = 'horizontal';
                    best.sum = sub.sum;
                    best.x = sub.start + 1;
                    best.y = i + 1;
                }
            }
            const ship = new battleShip(best.x, best.y, n, best.orientation);
            ships.push(ship);
            /* We set the count of the squares covered by the ship to 0,
             * this avoid overlaping greatly (but not totally) */
            ship.pos.forEach(p => {
                count[p.x - 1][p.y - 1] = 0;
                t_count[p.y - 1][p.x - 1] = 0;
            });
        }
        return ships;
    }
}

const newGameControl = new NewGameControl(divMap, vessels, map.olMap);
newGameControl.addToMap(map.olMap);

vessels.connect();
