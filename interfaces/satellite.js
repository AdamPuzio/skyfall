var socket = require('socket.io')
	, Satellite = require('../lib/SkyfallSatellite.js');

module.exports = function(config){
	var port = config.satellite.port;
	var io = socket.listen(port);
	io.set('log level', config.satellite.logLevel);
	console.log('Skyfall Satellite listening on port ' + port);
	
	Satellite.boot(io, function(){
		io.sockets.on('connection', function(socket){
			Satellite.registerSocket(socket, function(mods){
				socket.emit('auth', mods);
			});
			
			socket.on('disconnect', function() {
				Satellite.unregisterSocket(socket);
			});
			
			socket.on('subscribe', function(modname, cb) {
				Satellite.subscribe(socket, modname, cb);
			});
			
			socket.on('unsubscribe', function(modname, cb) {
				Satellite.unsubscribe(socket, modname, cb);
			});
		});
	});
};