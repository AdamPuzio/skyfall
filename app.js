
/**
 * Module dependencies.
 */

var express = require('express')
	, app = express()
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, server = http.createServer(app)
	, io = require('socket.io').listen(server)
	, exec = require('child_process').exec
	, util = require('util')
	, os = require('os');

io.set('log level', 1);

app.configure(function(){
  app.set('port', process.env.PORT || 3007);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('skyfall'));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);

server.listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

var pollRequestId;

function startRequest(socket, interval){
	if(!interval) interval = 2000;
	var sysInfo = {
		hostname: os.hostname()
		, type: os.type()
		, platform: os.platform()
		, arch: os.arch()
		, release: os.release()
		, cpus: os.cpus()
	};
	socket.emit('sysInfo', sysInfo);
	
	pollRequestId = setInterval(function()  {
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

function stopRequest(){
	clearInterval(pollRequestId);
	pollRequestId = null;
}

io.sockets.on('connection', function (socket) {
	socket.on('start', function (data) {
		startRequest(socket);
	});
	socket.on('stop', function (data) {
		stopRequest();
	});
	socket.on('disconnect', function(){
		stopRequest();
	});
});
