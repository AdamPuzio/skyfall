
var util = require('util')
	, EventEmitter = require('events').EventEmitter
	, ioClient = require('socket.io-client')
	, Skyfall = require('./Skyfall');

var ioServer
	, DS = {Sockets: {}, Satellites: {}}
	, Sockets = {}
	, Satellites = {};

function SkyfallServer(){}

util.inherits(SkyfallServer, EventEmitter);

SkyfallServer.prototype.boot = function(io, cb){
	if(typeof cb !== 'function') cb = function(){};
	ioServer = io;
	cb();
};

SkyfallServer.prototype.registerSocket = function(socket){
	this.log('Registering socket ' + socket.id);
	DS.Sockets[socket.id] = {
		_obj: socket
		, satellites: {}
	};
};

SkyfallServer.prototype.unregisterSocket = function(socket){
	this.log('Unregistering socket ' + socket.id);
	for(var satelliteId in DS.Sockets[socket.id].satellites){
		this.unregisterSocketToSatellite(socket, satelliteId);
	}
	delete DS.Sockets[socket.id];
	this.checkSatellites();
};

SkyfallServer.prototype.registerSocketToSatellite = function(socket, satelliteId, cb){
	this.log('Registering socket ' + socket.id + ' to satellite ' + satelliteId);
	cb = this.validateCallback(socket, cb);
	var self = this;
	var socketId = socket.id;
	this.getSatellite(satelliteId, function(satellite){
		if(DS.Sockets[socketId]){
			DS.Sockets[socketId].satellites[satelliteId] = {};
			DS.Satellites[satelliteId].sockets[socketId] = {};
			
			cb(satellite._modules);
		}
	});
};

SkyfallServer.prototype.unregisterSocketToSatellite = function(socket, satelliteId, cb){
	this.log('Unregistering socket ' + socket.id + ' to satellite ' + satelliteId);
	cb = this.validateCallback(socket, cb);
	for(var modname in DS.Sockets[socket.id].satellites[satelliteId]){
		this.unsubscribe(socket, satelliteId, modname)
	}
	delete DS.Sockets[socket.id].satellites[satelliteId];
	delete DS.Satellites[satelliteId].sockets[socket.id];
	this.checkSatellites();
};

SkyfallServer.prototype.subscribe = function(socket, satelliteId, mod, cb){
	cb = this.validateCallback(socket, cb);
	var self = this;
	var key = satelliteId + '_-mod-_' + mod;
	this.getSatellite(satelliteId, function(satellite){
		self.log('Subscribing ' + socket.id + ' to module ' + mod);
		var info = {
			mod: mod
			, server: satelliteId
		};
		var fn = function(data){
			DS.Satellites[satelliteId].modules[mod][socket.id] = true;
			DS.Satellites[satelliteId].sockets[socket.id][mod] = true;
			DS.Sockets[socket.id].satellites[satelliteId][mod] = true;
			socket.join(key);
			socket.emit('event', info, data);
		};
		DS.Satellites[satelliteId].modules[mod] = {};
		satellite._obj.on(mod, function(data){
			ioServer.sockets.in(key).emit('event', info, data);
		});
		satellite._obj.emit('subscribe', mod, fn);
	});
};

SkyfallServer.prototype.unsubscribe = function(socket, satelliteId, mod, cb){
	cb = this.validateCallback(socket, cb);
	var self = this;
	var key = satelliteId + '_-mod-_' + mod;
	this.getSatellite(satelliteId, function(satellite){
		self.log('- Unsubscribing ' + socket.id + ' from module ' + mod);
		delete DS.Sockets[socket.id].satellites[satelliteId][mod];
		delete DS.Satellites[satelliteId].sockets[socket.id][mod];
		self.checkSatellites();
		socket.leave(key);
	});
};

SkyfallServer.prototype.checkSatellites = function(cb){
	if(typeof cb !== 'function') cb = function(){};
	this.log('Checking Satellites');
	for(var satelliteId in DS.Satellites){
		var satellite = DS.Satellites[satelliteId];
		for(var mod in satellite.modules){
			if(Object.keys(satellite.modules[mod]).length == 0){
				satellite._obj.emit('unsubscribe', mod);
				delete DS.Satellites[satelliteId].modules[mod];
			}
		}
		if(Object.keys(satellite.sockets).length == 0){
			this.satelliteDisconnect(satelliteId);
		}
	}
	cb();
};

SkyfallServer.prototype.getSatellite = function(satellite, cb){
	var self = this;
	if(!DS.Satellites[satellite]){
		this.log('Need to connect...');
		this.satelliteConnect(satellite, cb);
	}else{
		var sat = DS.Satellites[satellite];
		if(sat._obj.connected === true){
			this.log('Already connected...');
			cb(sat);
		}else if(sat._obj.connecting === true){
			this.log('Waiting to connect...');
			sat._obj.on('auth', function(){
				cb(sat);
			});
		}else{
			this.log('Need to reconnect');
			var fn = function(mods){
				DS.Satellites[satellite]['_modules'] = mods;
				cb(DS.Satellites[satellite]);
				sat._obj.removeListener('auth', fn);
			};
			sat._obj.on('auth', fn);
			sat._obj.connect();
		}
	}
};

SkyfallServer.prototype.satelliteConnect = function(server, cb){
	if(typeof cb !== 'function') cb = function(){};
	var self = this;
	this.log('Connecting to Satellite ' + server + '...');
	var satelliteId = server;
	var satellite = ioClient.connect('http://' + server, {
		reconnect: false
	});
	
	DS.Satellites[satelliteId] = {
		_obj: satellite
		, _modules: []
		, modules: {}
		, sockets: {}
	};
	
	var fn = function(mods){
		DS.Satellites[satelliteId]['_modules'] = mods;
		cb(DS.Satellites[satelliteId]);
		satellite.removeListener('auth', fn);
	};
	satellite.on('auth', fn);
	
	satellite.on('connect', function(mods){
		self.log('Connected to Satellite ' + server);
	});
};

SkyfallServer.prototype.satelliteDisconnect = function(satelliteId, cb){
	if(typeof cb !== 'function') cb = function(){};
	this.log('Disconnecting from Satellite ' + satelliteId);
	DS.Satellites[satelliteId]._obj.disconnect();
	//delete DS.Satellites[satelliteId];
};

SkyfallServer.prototype.getModules = function(){
	return Skyfall.getModules();
};

SkyfallServer.prototype.validateCallback = function(socket, cb){
	if(typeof cb !== 'function') cb = function(){};
	return cb;
};

SkyfallServer.prototype.log = function(val){
	console.log('SkyfallServer: ' + val);
};

SkyfallServer.prototype.fn = function(){
	
};

module.exports = new SkyfallServer;