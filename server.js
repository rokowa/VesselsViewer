const express = require('express');
const path = require('path');
const http = require('http');
const io = require('socket.io');

function getData(socket) {
    http.get(
        'http://data.aishub.net/ws.php?username=***REMOVED***&format=1&output=json&compress=0',
        // 'http://localhost:3000/data2.json',
        res => {
            res.setEncoding('utf8');
            let body = '';
            res.on('data', data => {
                body += data;
            });
            res.on('end', () => {
                // console.log(body);
                socket.emit('vessels', body);
            });
        }
    );
}

let connected = 0;
let timer = null;

const app = express();
const server = http.Server(app);

const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'dist')));

const socket = io(server);
socket.on('connection', userSocket => {
    connected++;
    if (connected === 1) {
        console.log('Client connected, sending data...');
        getData(socket);
        timer = setInterval(() => {
            getData(socket);
        }, 70000);
    }
    // console.log(`${connected} users connected`);
    userSocket.on('disconnect', () => {
        connected--;
        if (connected === 0 && timer !== null) {
            clearInterval(timer);
        }
        // console.log(`${connected} users connected`);
    });
});

server.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
