
var config = require('../lib/SkyfallConfig')
	, Skyfall = require('../lib/Skyfall')
	, _ = require('underscore');

renderStack = function(req, res, cfg){
	var includes = Skyfall.getIncludes();
	var url = req.protocol + '://' + req.headers.host
	var hostEx = req.headers.host.split(':');
	var host = hostEx[0];
	var servers = {};
	if(config.satellite){
		servers[host] = {
			host: host
			, port: config.satellite.port || 3007
		};
	}
	var cfg = _.extend({
		title: 'Skyfall'
		, mainUrl: url
		, url: req.url
		, protocol: req.protocol
		, host: host
		, servers: servers
		, includes: includes
	}, cfg);
	res.render('index', cfg);
};

render404 = function(req, res, error){
	var url = req.protocol + '://' + req.headers.host
	res.render('error/404', {
		title: 'Skyfall'
		, status: 404
		, mainUrl: url
		, url: req.url
		, header: error
	});
};

/*
 * GET main page.
 */

exports.index = renderStack;

/*
 * GET stack page
 */

exports.stack = function(req, res){
	var stack = req.params.stack;
	var fs = require('fs');
	fs.exists = fs.exists || require('path').exists;
	fs.existsSync = fs.existsSync || require('path').existsSync;
	var file = 'config/stack/' + stack + '.json';
	fs.exists(file, function(exists){
		if(exists){
			Skyfall.loadJsonFile(file, function(err, json){
				if(err){
					return render404(req, res, err);
				}
				renderStack(req, res, json);
			});
		}else{
			var error = stack + ' stack not found';
			render404(req, res, error);
		}
	});
};