import { Map, Vessels, Popup } from './viewer';

const divMap = document.getElementById('map');
const vessels = new Vessels();
const map = new Map(divMap);
vessels.addToMap(map.olMap);
vessels.connect();

// function countVessels(grid, offset) {
//     const count = Array(10)
//         .fill()
//         .map(() => Array(10).fill(0));
//     const pixels = steadySource
//         .getFeatures()
//         .concat(movingSource.getFeatures())
//         .map(f => {
//             return map.getPixelFromCoordinate(f.getGeometry().getCoordinates());
//         });
//     let loopCount = 0;
//     pixels.forEach(p => {
//         for (let i = 0; i < 10; i++) {
//             for (let j = 0; j < 10; j++) {
//                 loopCount++;
//                 let topLeft = grid.coordSquareToCanvas(i + 1, j + 1);
//                 if (
//                     p[0] >= topLeft[0] + offset[0] &&
//                     p[0] <= topLeft[0] + grid.squareSize + offset[0] &&
//                     p[1] >= topLeft[1] + offset[1] &&
//                     p[1] <= topLeft[1] + grid.squareSize + offset[1]
//                 ) {
//                     count[i][j]++;
//                 }
//             }
//         }
//     });
//     return count;
// }

// const divMap = document.getElementById('map');
// // const divViewport = document.querySelector('.ol-viewport');
// const canvasGrid = document.createElement('canvas');
// canvasGrid.style.pointerEvents = 'none';
// const ctx = canvasGrid.getContext('2d');
// const grid = new Grid(0, 0, 50, 1, 'black');
// const size = grid.getSize();
// canvasGrid.width = size;
// canvasGrid.height = size;
// canvasGrid.style.position = 'relative';
// canvasGrid.style.top = '50%';
// canvasGrid.style.left = '50%';
// canvasGrid.style.transform = 'translate(-50%, -50%)';

// grid.draw(ctx);

// const controlGrid = new Control({
//     element: canvasGrid,
// });
// map.addControl(controlGrid);

// // divMap.addEventListener('mousemove', event => {
// //     const x = event.clientX;
// //     const y = event.clientY;
// //     console.log(`(${x}, ${y}), (${map.getCoordinateFromPixel([x, y])})`);
// // });

// // const divLog = document.createElement('div');
// // divLog.id = 'log';
// // document.body.appendChild(divLog);
// // divLog.innerHTML = `${divMapRect.left}, ${divMapRect.top}<br>${canvasGridRect.left}, ${canvasGridRect.top}<br>${offset[0]}, ${offset[1]}`;

// // map.on('rendercomplete', event => {
// //     console.log(countVessels([100, 100], [400, 400]));
// // });
// map.on('rendercomplete', event => {
//     const divMapRect = divMap.getBoundingClientRect();
//     const canvasGridRect = canvasGrid.getBoundingClientRect();
//     const offset = [
//         canvasGridRect.left - divMapRect.left,
//         canvasGridRect.top - divMapRect.top,
//     ];
//     // const count = countVessels(grid, offset);
//     const count = countVessels(grid, offset);
//     const t_count = count[0].map((_, colIndex) =>
//         count.map(row => row[colIndex])
//     );
//     const vessels = [];
//     for (let n of [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]) {
//         let best = null;
//         for (let i = 0; i < count.length; i++) {
//             let sub = max_subarray(count[i], n);
//             if (best === null) {
//                 best = {
//                     orientation: 'vertical',
//                     sum: sub.sum,
//                     x: i + 1,
//                     y: sub.start + 1,
//                 };
//             } else if (sub.sum > best.sum) {
//                 best.sum = sub.sum;
//                 best.x = i + 1;
//                 best.y = sub.start + 1;
//             }
//         }
//         for (let i = 0; i < t_count.length; i++) {
//             let sub = max_subarray(t_count[i], n);
//             if (sub.sum > best.sum) {
//                 best.orientation = 'horizontal';
//                 best.sum = sub.sum;
//                 best.x = sub.start + 1;
//                 best.y = i + 1;
//             }
//         }
//         let ship = new Ship(best.x, best.y, n, best.orientation);
//         vessels.push(ship);
//         ship.pos.forEach(p => {
//             count[p.x - 1][p.y - 1] = 0;
//             t_count[p.y - 1][p.x - 1] = 0;
//         });
//     }
//     // for (let i = 0; i < count.length; i++) {
//     //     let subarray = max_subarray(count[i], 4);
//     //     vessels.push(new Ship(i + 1, subarray.start + 1, 4, 'vertical'));
//     // }
//     ctx.clearRect(0, 0, canvasGrid.width, canvasGrid.height);
//     grid.draw(ctx);
//     vessels.forEach(v => v.draw(ctx, grid));
//     // for (let i = 0; i < 10; i++) {
//     //     for (let j = 0; j < 10; j++) {
//     //         ctx.textAlign = 'center';
//     //         ctx.textBaseline = 'middle';
//     //         let coord = grid.coordSquareToCanvas(i + 1, j + 1);
//     //         ctx.fillText(
//     //             count[i][j],
//     //             coord[0] + grid.squareSize / 2,
//     //             coord[1] + grid.squareSize / 2
//     //         );
//     //     }
//     //}
// });

// //https://en.wikipedia.org/wiki/Maximum_subarray_problem#Kadane%27s_algorithm
// function max_subarray(numbers, length) {
//     let bestSum = 0;
//     for (let i = 0; i < length; i++) {
//         bestSum += numbers[i];
//     }
//     let currentSum = bestSum;
//     let bestStart = 0;
//     for (let i = length; i < numbers.length; i++) {
//         currentSum += numbers[i] - numbers[i - length];
//         if (currentSum > bestSum) {
//             bestSum = currentSum;
//             bestStart = i - length + 1;
//         }
//     }
//     return {
//         sum: bestSum,
//         start: bestStart,
//     };
// }

// function generateVessels(count) {}
// console.log(grid.coordSquareToCanvas(1, 1));
// console.log(offset);
// console.log(countVessels([100, 100], [400, 400]));
