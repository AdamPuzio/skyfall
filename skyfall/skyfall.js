
exports.fall = function(){
	var pollRequestId = null
	, servers = null
	, interval = 2000

	, startRequest = function(os, socket, skyfall){
		var interval = skyfall.interval;
		var sysInfo = {
			hostname: os.hostname()
			, type: os.type()
			, platform: os.platform()
			, arch: os.arch()
			, release: os.release()
			, cpus: os.cpus()
		};
		socket.emit('sysInfo', sysInfo);
		pollRequestId = setInterval(function()	{
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
		}, interval);
	}
	, stopRequest = function(){
		clearInterval(pollRequestId);
		pollRequestId = null;

	}
	, getServerList = function(){
		return {};
	}
	, init = function(io, os){
		var skyfall = this;
		io.sockets.on('connection', function (socket) {
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
		, servers: getServerList
		, interval: 2000
	}
}();
