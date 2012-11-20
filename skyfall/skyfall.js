
exports.fall = function(){
	var pollRequestId = null
	, diskspacePollRequestId = null
	, servers = null
	, interval = 2000

	, startRequest = function(os, socket, scope){
		var interval = scope.interval;
		var sysInfo = {
			hostname: os.hostname()
			, type: os.type()
			, platform: os.platform()
			, arch: os.arch()
			, release: os.release()
			, cpus: os.cpus()
		};
		socket.emit('sysInfo', sysInfo);
		pollRequestId = setInterval(scope.emitServerLoad, interval, scope);
		scope.emitServerLoad(scope);
		
		diskspacePollRequestId = setInterval(scope.emitDiskspace, 10000, scope);
		scope.emitDiskspace(scope);
	}
	
	, stopRequest = function(){
		clearInterval(pollRequestId);
		pollRequestId = null;
		clearInterval(diskspacePollRequestId);
		diskspacePollRequestId = null;
	}
	
	, emitServerLoad = function(scope){
		var os = scope.os;
		var output = {
			ts: new Date().toJSON()
			, uptime: os.uptime()
			, loadavg: os.loadavg()
			, totalmem: os.totalmem()
			, freemem: os.freemem()
			, cpus: os.cpus()
			, networkInterfaces: os.networkInterfaces()
		};
		scope.socket.emit('loadInfo', output);
	}
	
	, emitDiskspace = function(scope){
		var socket = scope.socket;
		scope.diskspace.check('/', function (total, free, status){
			var output = {
				total: total
				, free: free
				, status: status
			};
			socket.emit('diskspace', output);
		});
	}
	
	, init = function(io, os){
		var skyfall = this;
		this.diskspace = require('diskspace');
		this.os = os;
		io.sockets.on('connection', function (socket) {
			skyfall.socket = socket;
			socket.on('start', function (data) {
				startRequest(os, socket, skyfall);
			});
			socket.on('stop', function (data) {
				stopRequest();
			});
			socket.on('disconnect', function(){
				stopRequest();
			});
		});
	};
	
	return {
		start:init
		, interval: 2000
		, emitDiskspace: emitDiskspace
		, emitServerLoad: emitServerLoad
		, diskspace: null
	}
}();
