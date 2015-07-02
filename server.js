var fs = require('fs');
var server = require('http');

var _ = require('underscore');

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./storage');
}

var server = require('http').createServer(function(req, response){
  fs.readFile(__dirname+'/index.html', function(err, data){
    response.writeHead(200, {'Content-Type':'text/html'});
    response.write(data);
    response.end();
  });
});
server.listen(1577);
var io = require('socket.io').listen(server);
console.log("Server at 127.0.0.1:1577");

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
	
	// wenn ein Benutzer einen Text senden
	socket.on('MACHINE__eject', function (data) {
		// eject machine here
	});

	// on ejected
	io.sockets.emit('MACHINE__message', { message: 'ejected' });

	// on new coin with coinVal = 100/50/200
	io.sockets.emit('MACHINE__hasCoin', { coin: coinVal });

	// on get user message via http ?user=val
	io.sockets.emit('KINECT_stateChange', { state: userInFront });
});