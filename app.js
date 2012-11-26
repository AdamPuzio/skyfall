/**
 * Module dependencies.
 */

var express = require('express')
	, app = express()
	, routes = require('./routes')
	, http = require('http')
	, path = require('path')
	, server = http.createServer(app)
	, exec = require('child_process').exec
	, util = require('util')
	, engine = require('ejs-locals')
	, sky = require('./skyfall/skyfall');

app.configure(function(){
	app.set('port', process.env.PORT || 3007);
	app.engine('ejs', engine);
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

app.get('/server/:server', routes.server);
app.get('/stack/:stack', routes.stack);
app.get('/', routes.index);


/*** START SKYFALL ****/
sky.fall.start(server);


server.listen(app.get('port'), function(){
	console.log("Skyfall server listening on port " + app.get('port'));
});
