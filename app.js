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
	, os = require('os')
  , sky = require('./skyfall/skyfall');

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


/*** START SKYFALL ****/
sky.fall.start(io);


server.listen(app.get('port'), function(){
	console.log("Skyfall server listening on port " + app.get('port'));
});
