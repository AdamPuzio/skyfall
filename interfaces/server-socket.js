var socket = require('socket.io')
	, SkyfallServer = require('../lib/SkyfallServer.js');

module.exports = function(server, config){
	var port = config.server.port;
	var io = socket.listen(server);
	io.set('log level', config.server.logLevel);
	
	SkyfallServer.boot(io, function(){
		io.sockets.on('connection', function(socket){
			SkyfallServer.registerSocket(socket);
			
			socket.on('disconnect', function() {
				SkyfallServer.unregisterSocket(socket);
			});
			
			socket.on('auth', function() {
				
			});
			
			socket.on('register', function(server, cb) {
				SkyfallServer.registerSocketToSatellite(socket, server, cb);
			});
			
			socket.on('unregister', function(server, cb) {
				SkyfallServer.unregisterSocketToSatellite(socket, server, cb);
			});
			
			socket.on('subscribe', function(server, modname, cb) {
				SkyfallServer.subscribe(socket, server, modname, cb);
			});
			
			socket.on('unsubscribe', function(server, modname, cb) {
				SkyfallServer.unsubscribe(socket, server, modname, cb);
			});
		});
	});
};