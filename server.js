/**
 * Loading dependencies
 */
var fs = require('fs');
var server = require('http');
var url = require('url') ;
var _ = require('underscore');
var express = require('express');
var SerialPort = require("serialport").SerialPort;

/**
 * Including localStorage for permanently saving credit
 */
if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./storage');
}

/**
 * Opening serial port
 */
var serialPort = new SerialPort("/dev/tty-usbserial1", {
  baudrate: 57600
});

serialPort.on("open", function () {
	console.log('SERIAL open');
	serialPort.on('data', function(data) {
		console.log('SERIAL data received: ' + data);
		if(data == 'e:1') {
			// on ejected
			io.sockets.emit('MACHINE__message', { message: 'ejected' });
		} else if(data.substring(0, 1) == 'p:') {
			// on coin
			var coinVal = data.substring(2, data.length-1);
			io.sockets.emit('MACHINE__hasCoin', { coin: coinVal });
			console.log('COIN inserted: '+coinVal);
		}  
	});

  	// client requests ejection
	io.sockets.on('MACHINE__eject', function (data) {
		// eject machine here
		serialPort.write("e\n", function(err, results) {
			console.log('SERIAL error ' + err);
			console.log('SERIAL results ' + results);
		});
	});
});

/**
 * Starting express app
 */
var app = express();

/**
 * Starting server
 */
var server = app.listen(1577, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('SERVER listening at http://%s:%s', host, port);

});

// Serving static files (like index.html)
app.use(express.static(__dirname + '/'));

// Starting socket connection
var io = require('socket.io').listen(server);

/**
 * PROGRAMM VARS
 */
// The amount of money users have inserted from the first day
var globalCredit = localStorage.getItem('globalCredit') || 0;
// The current state that says whether a user is in front of the machine or not
var userInFront = false;

// Websocket
io.sockets.on('connection', function (socket) {
// der Client ist verbunden
});


// on get user message via http ?user=val
app.get('/controller', function (req, res) {
	console.log(req.query.kinect);
	if(req.query.kinect == "true") {
		userInFront = true;
	} else {
		userInFront = false;
	}
	res.send('KINECT status set to '+userInFront+'.');
  	io.sockets.emit('KINECT_stateChange', { state: userInFront });
});