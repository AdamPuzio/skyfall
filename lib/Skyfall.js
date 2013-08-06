var util = require('util')
	, _ = require('underscore')
	, fs = require('fs')
	, async = require('async')
	, EventEmitter = require('events').EventEmitter
	, ioClient = require('socket.io-client');

var Config = {
	moduleDir: 'skyfall_modules/'
	, mainDir: null
};
var Modules = {}
	, Includes = {};

function Skyfall(){ }

util.inherits(Skyfall, EventEmitter);

Skyfall.prototype.boot = function(mainDir, cfg, cb){
	console.log('Booting up Skyfall');
	if(typeof cb !== 'function') cb = function(){};
	
	_.extend(Config, cfg);
	
	async.parallel({
		Modules: async.apply(this.registerModules.bind(this))
	}, function(err, results){
		console.log('Skyfall locked and loaded');
		_.extend(this, results);
		cb();
	});
};

Skyfall.prototype.getModules = function(){
	return Modules;
};

Skyfall.prototype.registerModules = function(cb){
	if(typeof cb !== 'function') cb = function(){};
	var self = this;

	fs.readdir(Config.moduleDir, function(err, files){
		if(err){
			console.log('ERROR: ' + err);
			cb(err);
		}else{
			async.series([
				function(cb){
					async.filter(files, self.loadModule.bind(self), function(){ cb(null); });
				}
				, self.registerIncludes
			], function(err, results){
				cb(null, Modules)
			});
		}
	});
};

Skyfall.prototype.loadModule = function(modname, cb){
	var self = this;
	console.log('-- Loading module ' + modname + ' --');
	var modDir = Config.moduleDir + modname;
	
	var modFile = modDir + '/skyfall.json'
	var packageFile = modDir + '/package.json'
	var satFile = modDir + '/satellite.js';
	var publicDir = modDir + '/public';
	
	if(modname.charAt(0) == '.'){
		return cb(false);
	}else if(Config.modules != '*' && Config.modules.indexOf(modname) < 0){
		console.log('Skipping module ' + modname);
		return cb(false);
	}else if(!fs.existsSync(satFile)){
		console.error('Unable to load Skyfall Module ' + modname + ': no satellite.js file');
		cb(false);
	}else{
		async.parallel({
			module: function(cb){
				var mod = require('../' + satFile);
				cb(null, mod);
			}
			
			, config: function(cb){ self._checkJsonFile(modFile, cb); }
			
			, publicDir: function(cb){ cb(null, fs.existsSync(publicDir) ? publicDir : null); }
			
			//, package: function(cb){ self._checkJsonFile(packageFile, cb); }
			
		}, function(err, results){
			Modules[modname] = results;
			cb(true);
		});
	}
};

Skyfall.prototype.getIncludes = function(){
	return Includes;
};

Skyfall.prototype.registerIncludes = function(cb){
	for(var modname in Modules){
		var mod = Modules[modname];
		var modDir = '/modules/' + modname;
		if(mod.config && mod.config.includes && typeof mod.config.includes == 'object'){
			for(var includeType in mod.config.includes){
				if(!Includes[includeType]) Includes[includeType] = [];
				var modIncludes = mod.config.includes[includeType];
				for(var i=0; i<modIncludes.length; i++){
					Includes[includeType].push(modDir + '/' + modIncludes[i]);
				}
			}
		}
	}
	cb(null, Includes);
};

Skyfall.prototype._checkJsonFile = function(file, cb){
	this.loadJsonFile(file, function(err, json){
		if(err){
			cb(null, {});
		}else{
			cb(err, json);
		}
	});
};

Skyfall.prototype.loadJsonFile = function(file, cb){
	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			cb(err, {});
		}else{
			var err = null, json = {};
			try {
				var json = JSON.parse(data);
			}catch(e){
				
			}
			cb(err, json);
		}
	});
};

module.exports = new Skyfall;