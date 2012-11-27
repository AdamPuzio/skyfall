
exports.fall = function(){
	servers = null
	, interval = 2000

	, startRequest = function(socket){
		var scope = socket.scope;
		var os = scope.os;
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
		socket.pollRequestId = setInterval(scope.emitServerLoad, interval, socket);
		scope.emitServerLoad(socket);
		
		socket.diskspacePollRequestId = setInterval(scope.emitDiskspace, 10000, socket);
		scope.emitDiskspace(socket);
		
		socket.psPollRequestId = setInterval(scope.emitProcesses, 5000, socket);
		scope.emitProcesses(socket);
	}
	
	, stopRequest = function(socket){
		clearInterval(socket.pollRequestId);
		socket.pollRequestId = null;
		clearInterval(socket.diskspacePollRequestId);
		socket.diskspacePollRequestId = null;
	}
	
	, emitServerLoad = function(socket){
		var os = socket.scope.os;
		var output = {
			ts: new Date().toJSON()
			, uptime: os.uptime()
			, loadavg: os.loadavg()
			, totalmem: os.totalmem()
			, freemem: os.freemem()
			, cpus: os.cpus()
			, networkInterfaces: os.networkInterfaces()
		};
		socket.emit('loadInfo', output);
	}
	
	, emitDiskspace = function(socket){
		var scope = socket.scope;
		scope.diskspace.check('/', function (total, free, status){
			var output = {
				total: total
				, free: free
				, status: status
			};
			socket.emit('diskspace', output);
		});
	}
	
	, emitProcesses = function(socket){
		var scope = socket.scope;
		scope.exec('ps aux', function(err, stdout, stderr){
			//console.log(stdout);
			socket.emit('processes', stdout);
			//var processes = stdout.split("\n");
			//socket.emit('processes', processes);
		});
	}
	
	, init = function(server){
		io = require('socket.io').listen(server);
		io.set('log level', 1);
		this.os = require('os');
		this.diskspace = require('diskspace');
		this.exec = require('child_process').exec;
		var scope = this;
		io.sockets.on('connection', function (socket) {
			socket.scope = scope;
			socket.on('start', function (data) {
				startRequest(socket, data);
			});
			socket.on('stop', function (data) {
				stopRequest(socket, data);
			});
			socket.on('disconnect', function(data){
				stopRequest(socket, data);
			});
		});
	};
	
	return {
		start:init
		, interval: 2000
		, emitDiskspace: emitDiskspace
		, emitServerLoad: emitServerLoad
		, emitProcesses: emitProcesses
	}
}();
