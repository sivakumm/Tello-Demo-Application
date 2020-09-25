/* ============================== Imports ============================== */
const body_parser = require('body-parser');
const dgram = require('dgram');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const express = require('express');
const fs = require('fs');
const https = require('https');


/* ============================= Variables ============================= */
const credentials = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
}

const Drone_HOST = '192.168.10.1';
const Drone_PORT = '8889';
const Drone_STATE_PORT = '8890';
var currentState = '';


/* ======================== Drone communication ======================== */
const drone = dgram.createSocket('udp4');
drone.bind(Drone_PORT);

const droneState = dgram.createSocket('udp4');
droneState.bind(Drone_STATE_PORT);


/* ===================== WEB Server - API handling ===================== */
const app = express();                                      // create express app
const server = https.createServer(credentials, app);        // create HTTPS Server

app.use(express.static(__dirname + '/static/'));            // use compiled frontend files
app.use(body_parser.json());                                // use body parser

const api = express.Router();                               // setup route
app.use('/api/v1', api);                                    // API basic path

api.get('/currentStatus', (req, res) => {                   // called to get current drone values
    var dataSet = {};                                       // create empty set of data
    currentState.split(';').forEach(elem => {               // reformat drone values to usable object
        let elsplit = elem.split(':')
        if(elsplit.length > 1) {
            dataSet[elsplit[0]] = Number(elsplit[1]);
        }
    });
    return res.status(200).json({                           // send API response
        status: 200,
        statusText: 'OK',
        message: 'delivery of current values',
        data: dataSet
    });
});
        
api.post('/command', (req, res) => {                        // called to send command to drone
    let cmd = req.body.command;                             // read command in request body
    let val = req.body.value;                               // read value in request body

    switch(cmd) {                                           // reformat commands to tello commands
        case 'flip_left':
            cmd = 'flip l';
            break;
        case 'flip_right':
            cmd = 'flip r';
            break;
        case 'flip_forward':
            cmd = 'flip f';
            break;
        case 'flip_backward':
            cmd = 'flip b';
            break;
        case 'up':
            cmd = 'up ' + val;
            break;
        case 'down':
            cmd = 'down ' + val;
            break;
        case 'left':
            cmd = 'left ' + val;
            break;
        case 'right':
            cmd = 'right ' + val;
            break;
        case 'forward':
            cmd = 'forward ' + val;
            break;
        case 'back':
            cmd = 'back ' + val;
            break;
        case 'cw':
            cmd = 'cw 90';
            break;
        case 'ccw':
            cmd = 'ccw 90';
            break;
    }
    
    drone.send(cmd, 0, cmd.length, Drone_PORT, Drone_HOST, (err) => {           // send command to drone via UDP
        process.stdout.write('Sending command `' + cmd + '` ......');
        if(err) {                                                               // on error at sending
            console.log('...... failed: ', err);
            return res.status(409).json({                                       // error API response
                status: 409,
                statusText: 'Conflict',
                message: err
            });
        } else {
            let handled = false;                                                // variable to allow max 1 response to handle
            drone.on('message', (msg) => {
                if(!handled) {
                    handled = true;
                    if(msg.toString() == 'ok') {                                // on success
                        console.log('...... success: ', msg.toString());
                        return res.status(202).json({
                            status: 202,
                            statusText: 'Accepted',
                            message: 'Received command successfully'
                        });
                    } else {                                                    // on failure
                        console.log('...... failed: ', msg.toString());
                        return res.status(406).json({
                            status: 406,
                            statusText: 'Not Acceptable',
                            message: msg.toString()
                        });
                    }
                }
            });
        }
    });
});


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


async function isDroneConnected() {
    const { stdout, stderr } = await exec('ifconfig');
    
    if(stdout.includes('inet 192.168.10.')) {
        return true;
    } else {
        return false;
    }
}


server.listen(4443, async function() {                                                // start up web service
    console.log('Webservice listening on port', server.address().port);

    process.stdout.write('Connecting to drone ...');

    let connected = await isDroneConnected();
    while(!connected) {
        process.stdout.write('.');
        connected = await isDroneConnected();
        await delay(1000);
    }
    
    process.stdout.write(' connected\n');

    drone.send('command', 0, 'command'.length, Drone_PORT, Drone_HOST, (err) => {   // send 'command' command at the beginning
        process.stdout.write('Connecting to drone ......');                         // to bring Tello in SDK mode
        if(err) {
            console.log('...... failed: ', err);
        } else {
            let initialized = false;
            drone.on('message', (msg) => {
                if(!initialized) {
                    if(msg.toString() == 'ok') {
                        initialized = true;
                        console.log('...... success: ', msg.toString());
                    } else {
                        console.log('...... failed: ', msg.toString());
                    }
                }
            });
        }
    });
});

droneState.on('message', (msg) => {         // overwrite constantly drone state values
    currentState = msg.toString();
});

