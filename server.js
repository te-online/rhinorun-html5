/**
 * Loading dependencies
 */
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
 * PROGRAMM VARS
 */
// The amount of money users have inserted from the first day
var globalCredit = localStorage.getItem('globalCredit') || 0;
// The current state that says whether a user is in front of the machine or not
var userInFront = false;
// The Serial Port name 1411 or 1421
var serialPortName = "cu.usbmodem14241";

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

// on get user message via http /controller?kinect={true;false}
app.get('/controller', function (req, res) {
	console.log(req.query.kinect);
	if(req.query.kinect == "true") {
		userInFront = true;
	} else {
		userInFront = false;
	}
	res.send('KINECT status set to '+userInFront+'.');
  	io.sockets.emit('KINECT__stateChange', { state: userInFront });
});

/**
 * Opening serial port and performing all the actions
 */
var serialPort = new SerialPort("/dev/"+serialPortName, {
  baudrate: 57600
});

serialPort.on("open", function () {
	console.log('SERIAL open');
	serialPort.on('data', function(data) {
		data = String(data);
		console.log('SERIAL data received: ' + data);
		if(String(data) == String("e:1")) {
			// on ejected
			io.sockets.emit('MACHINE__message', { message: 'ejected' });
		} else if(String(data.substring(0, 2)) == String("c:")) {
			// on coin
			var coinVal = data.substring(2, data.length-1);
			globalCredit += coinVal;
			localStorage.setItem('globalCredit', globalCredit);
			io.sockets.emit('MACHINE__hasCoin', { coin: coinVal });
		}  
	});

	io.on('connection', function (socket) {
	  	// client requests ejection
		socket.on('MACHINE__eject', function (data) {
			// eject machine here
			console.log('eject NOW');
			serialPort.write("e", function(err, results) {
				console.log('SERIAL error ' + err);
				console.log('SERIAL results ' + results);
			});
		});
	});
});