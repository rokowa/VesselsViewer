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

class Player {
    constructor() {
        this.ships = [];
        this.shots = [];

        this.shotCount = 0;
        this.hitCount = 0;
    }

    shot(x, y) {
        if (this.shots.some(s => s.x === x && s.y === y)) {
            return false;
        } else {
            this.shotCount++;
            const shot = {
                x: x,
                y: y,
                hit: false,
            };
            for (let s of this.ships) {
                if (s.hit(x, y)) {
                    this.hitCount++;
                    shot.hit = true;
                    break;
                }
            }
            this.shots.push(shot);
            return true;
        }
    }

    hasLost() {
        return this.ships.every(s => s.sunk);
    }
}

class Board {
    constructor() {
        this.playerGrid = new Grid(0, 0, 30, 1, 'black');
        this.opponentGrid = new Grid(
            Math.floor(this.playerGrid.getSize()) + 10,
            0,
            30,
            1,
            'black'
        );
    }

    drawShots(ctx, grid, shots) {
        const r = grid.squareSize / 2 - 5;
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1;
        shots.forEach(shot => {
            let [x, y] = grid.coordSquareToCanvas(shot.x, shot.y);
            x += grid.squareSize / 2;
            y += grid.squareSize / 2;
            if (shot.hit) {
                ctx.fillStyle = 'red';
            } else {
                ctx.fillStyle = 'green';
            }
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
    }

    drawShips(ctx, grid, ships) {
        ships.forEach(ship => {
            ship.draw(ctx, grid);
        });
    }

    drawSunkShips(ctx, grid, ships) {
        ships.forEach(ship => {
            if (ship.sunk) {
                ship.draw(ctx, grid);
            }
        });
    }

    drawGrids(ctx) {
        this.playerGrid.draw(ctx);
        this.opponentGrid.draw(ctx);
    }

    static randomShips() {
        /* En Belgique, d'après wiki :
         * 1 cuirassé ( 4 cases)
         * 2 croiseurs (3 cases)
         * 3 torpilleurs (2 cases)
         * 4 sous-marin (1 case) */
        const ships = [];
        let x = 0,
            y = 0,
            orientation = '',
            ship = null;
        for (let n of [4, 3, 3, 2, 2, 2, 1, 1, 1, 1]) {
            let valid = false;
            do {
                x = Math.ceil(Math.random() * 10 + 1);
                y = Math.ceil(Math.random() * 10 + 1);
                orientation = Math.random() < 0.5 ? 'vertical' : 'horizontal';
                if (Ship.validDimension(x, y, n, orientation)) {
                    ship = new Ship(x, y, n, orientation);
                    if (!ships.some(s => ship.overlap(s))) {
                        valid = true;
                    }
                }
            } while (!valid);
            ships.push(ship);
        }
        return ships;
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.board = new Board();

        this.player = new Player();
        // this.player.ships = Board.randomShips();
        this.opponent = new Player();
        this.opponent.ships = Board.randomShips();

        this.divLog = document.getElementById('log');
        this.logger = message => (this.divLog.innerHTML += `${message}<br />`);

        //this.start();

        this.draw();
    }

    onClick(event) {
        let rect = this.canvas.getBoundingClientRect();
        o;
        let square = this.board.opponentGrid.coordCanvasToSquare(
            event.clientX - rect.left,
            event.clientY - rect.top
        );
        //If we are in the opponent grid
        if (square !== null) {
            //shot return false if there was already a shot there
            if (this.opponent.shot(square[0], square[1])) {
                this.draw();
                this.canvas.removeEventListener('click', this.onclick);
                if (this.opponent.hasLost()) {
                    this.win();
                } else {
                    this.opponentTurn();
                }
            }
        }
    }

    playerTurn() {
        // this.logger('Tour du joueur');
        this.canvas.addEventListener('click', e => this.onClick(e));
    }

    opponentTurn() {
        // this.logger("Tour de l'IA");
        let x = Math.floor(Math.random() * 10 + 1);
        let y = Math.floor(Math.random() * 10 + 1);
        this.player.shot(x, y);
        this.draw();
        if (this.player.hasLost()) {
            this.lose();
        } else {
            this.playerTurn();
        }
    }

    start() {
        this.draw();
        if (Math.random() < 0.5) {
            this.playerTurn();
        } else {
            this.opponentTurn();
        }
    }

    win() {
        this.logger('Gagné !');
    }

    lose() {
        this.logger('Perdu');
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.board.drawGrids(this.ctx);
        this.board.drawShips(
            this.ctx,
            this.board.playerGrid,
            this.player.ships
        );
        this.board.drawShots(
            this.ctx,
            this.board.playerGrid,
            this.player.shots
        );
        this.board.drawSunkShips(
            this.ctx,
            this.board.opponentGrid,
            this.opponent.ships
        );
        this.board.drawShots(
            this.ctx,
            this.board.opponentGrid,
            this.opponent.shots
        );
    }
}

// document.getElementById('startButton').addEventListener('click', e => {
//     new Game(document.getElementById('game'));
// });

export { Grid, Ship, Game };
