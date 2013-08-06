var os = require('os');

var SysInfo = {};
var requestId = {};
var interval = 2000;
var socket;
var eventEmitter;

function ServerMonitorModule(){}

ServerMonitorModule.prototype.init = function(fn){
	console.log('init Server Monitor Module');
	//socket = io;
	eventEmitter = fn;
	this.getServerLoad();
};

ServerMonitorModule.prototype.start = function(){
	console.log('start ServerMonitorModule');
	this.getServerLoad();
	requestId = setInterval(this.getServerLoad, interval, this);
};

ServerMonitorModule.prototype.stop = function(){
	clearInterval(requestId);
};

ServerMonitorModule.prototype.connect = function(cb){
	if(typeof cb !== 'function') cb = function(){};
	cb(SysInfo);
};

ServerMonitorModule.prototype.disconnect = function(cb){
	if(typeof cb !== 'function') cb = function(){};
	cb();
};

ServerMonitorModule.prototype.getServerLoad = function(){
	SysInfo = {
		ts: new Date().toJSON()
		, uptime: os.uptime()
		, loadavg: os.loadavg()
		, totalmem: os.totalmem()
		, freemem: os.freemem()
		, cpus: os.cpus()
		, networkInterfaces: os.networkInterfaces()
	};
	eventEmitter(SysInfo);
	//socket.sockets.in('skyfall-server-monitor').emit(SysInfo);
	//console.log(SysInfo);
};

ServerMonitorModule.prototype.emit = function(data){
	var fn = eventEmitter;
	//if(typeof fn != 'function') fn = 
};

module.exports = new ServerMonitorModule;