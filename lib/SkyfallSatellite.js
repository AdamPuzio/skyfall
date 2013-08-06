
var util = require('util')
	, async = require('async')
	, EventEmitter = require('events').EventEmitter
	, Skyfall = require('./Skyfall');

var Modules = {}, Sockets = {}, Server;

function SkyfallSatellite(){}

util.inherits(SkyfallSatellite, EventEmitter);

SkyfallSatellite.prototype.boot = function(io, cb){
	if(typeof cb !== 'function') cb = function(){};
	var self = this;
	Server = io;
	Modules = Skyfall.getModules();
	async.each(Object.keys(Modules), function(modId, cb){
		var mod = Modules[modId];
		fn = self.eventEmitter(modId);
		if(mod.module && mod.module.init) mod.module.init(fn);
		cb(null);
	}, function(err){
		cb();
	});
};

SkyfallSatellite.prototype.registerSocket = function(socket, cb){
	if(typeof cb !== 'function') cb = function(){};
	this.log('Registering socket ' + socket.id);
	Sockets[socket.id] = {
		socket: socket
		, mods: {}
	};
	cb(Object.keys(Modules));
};

SkyfallSatellite.prototype.unregisterSocket = function(socket, cb){
	if(typeof cb !== 'function') cb = function(){};
	var self = this;
	this.log('Unregistering socket ' + socket.id);
	var socketObj = Sockets[socket.id];
	
	async.each(Object.keys(socketObj.mods), function(modname, cb){
		self.unsubscribe(socket, modname, function(){
			cb(null);
		});
	}, function(){
		delete Sockets[socket.id];
	});
};

SkyfallSatellite.prototype.subscribe = function(socket, mod, cb){
	if(typeof cb !== 'function') cb = function(){};
	this.log('Subscribing ' + socket.id + ' to module ' + mod);
	
	if(!Modules[mod]){
		// Module not available
		return;
	}
	var module = Modules[mod];
	if(!module.sockets){
		Modules[mod].sockets = {};
		module.module.start();
	}
	
	if(Sockets[socket.id]){
		socket.join(mod);
		Sockets[socket.id]['mods'][mod] = true;
		Modules[mod].sockets[socket.id] = socket;
	}
	module.module.connect(cb);
};

SkyfallSatellite.prototype.unsubscribe = function(socket, mod, cb){
	if(typeof cb !== 'function') cb = function(){};
	this.log('Unsubscribing ' + socket.id + ' from module ' + mod);
	
	if(Sockets[socket.id]){
		socket.leave(mod);
		delete Sockets[socket.id]['mods'][mod];
	}
	var module = Modules[mod];
	delete Modules[mod].sockets[socket.id];
	if(Object.keys(Modules[mod].sockets).length == 0){
		delete Modules[mod].sockets;
		Modules[mod].module.stop();
	}
	
	module.module.disconnect();
	cb();
};

SkyfallSatellite.prototype.eventEmitter = function(mod){
	return function(data){
		Server.sockets.in(mod).emit(mod, data);
	};
};

SkyfallSatellite.prototype.log = function(val){
	console.log('SkyfallSatellite: ' + val);
};

SkyfallSatellite.prototype.fn = function(){
	
};

module.exports = new SkyfallSatellite;