
exports.fall = function(){
	servers = null
	, interval = 2000

	, startRequest = function(os, socket, scope, session){
		var interval = scope.interval;
		var sysInfo = {
			hostname: os.hostname()
			, type: os.type()
			, platform: os.platform()
			, arch: os.arch()
			, release: os.release()
			, cpus: os.cpus()
			, key: session.id
		};
		socket.emit('sysInfo', sysInfo);
		session.pollRequestId = setInterval(scope.emitServerLoad, interval, scope, session);
		scope.emitServerLoad(scope, session);
		
		session.diskspacePollRequestId = setInterval(scope.emitDiskspace, 10000, scope, session);
		scope.emitDiskspace(scope, session);
	}
	
	, stopRequest = function(socket, scope, session){
		if(!session) return;
		clearInterval(session.pollRequestId);
		session.pollRequestId = null;
		clearInterval(session.diskspacePollRequestId);
		session.diskspacePollRequestId = null;
	}
	
	, emitServerLoad = function(scope, session){
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
		session.socket.emit('loadInfo', output);
	}
	
	, emitDiskspace = function(scope, session){
		var socket = session.socket;
		scope.diskspace.check('/', function (total, free, status){
			var output = {
				total: total
				, free: free
				, status: status
			};
			socket.emit('diskspace', output);
		});
	}
	
	, createSession = function(scope){
		scope.sessionId++;
		var sessionId = scope.sessionId;
		session = scope.sessions['S' + sessionId] = {id: sessionId};
		return session;
	}
	
	, getSession = function(scope, id){
		if(scope.sessions && scope.session['S' + sessionId]) return scope.session['S' + sessionId];
		return null;
	}
	
	, init = function(io, os){
		var skyfall = this;
		this.diskspace = require('diskspace');
		this.os = os;
		io.sockets.on('connection', function (socket) {
			var session = skyfall.createSession(skyfall);
			session.socket = socket;
			socket.on('start', function (data) {
				if(data && data.key) session = skyfall.sessions['S' + data.key];
				startRequest(os, socket, skyfall, session);
			});
			socket.on('stop', function (data) {
				stopRequest(socket, skyfall, session);
			});
			socket.on('disconnect', function(data){
				stopRequest(socket, skyfall, session);
			});
		});
	};
	
	return {
		start:init
		, interval: 2000
		, emitDiskspace: emitDiskspace
		, emitServerLoad: emitServerLoad
		, createSession: createSession
		, diskspace: null
		, sessions: {}
		, sessionId: 0
	}
}();
