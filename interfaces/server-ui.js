var SkyfallServer = require('../lib/SkyfallServer.js')
	, path = require('path')
	, http = require('http')
	, express = require('express')
	, engine = require('ejs-locals')
	, app = express()
	, server = http.createServer(app)
	, socket = require('./server-socket.js')
	, routes = require('../routes')

const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const methodOverride = require('method-override')
const session = require('express-session')
const errorHandler = require('errorhandler')

var config;
var module_scripts = [];

module.exports = function(cfg){
	config = cfg;
	var dir = config.mainDir;
  console.log('mainDir: ' + dir)
	var modules = SkyfallServer.getModules();
	
	//app.configure(function(){
		app.set('port', config.server.port);
		app.set('views', dir + '/views');
		app.set('view engine', 'ejs');
		app.engine('ejs', engine);
		//app.use(express.logger('dev'));
		app.use(bodyParser());
		app.use(methodOverride());
		app.use(cookieParser(config.server.secret));
		app.use(session());
		//app.use(app.router);
		//app.use(require('less-middleware')({ src: dir + '/public' }));
		app.use(require('less-middleware')(dir + '/public'));
		app.use(express.static(path.join(dir, 'public')));
		
		for(var modname in modules){
			var mod = modules[modname];
			var modDir = '/modules/' + modname;
			if(mod.publicDir){
				app.use(modDir, express.static(mod.publicDir));
			}
		}
	//});
	
	//app.configure('development', function(){
		app.use(errorHandler());
	//});
	
	app.get('/', routes.index);
	app.get('/stack/:stack', routes.stack);
	
	server.listen(app.get('port'), function(){
		console.log('Skyfall Server listening on port ' + app.get('port'));
		socket(server, config);
	});
};
