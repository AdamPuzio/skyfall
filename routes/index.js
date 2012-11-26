
/*
 * GET home page.
 */

exports.index = function(req, res){
	var fs = require('fs');
	fs.exists = fs.exists || require('path').exists;
	fs.existsSync = fs.existsSync || require('path').existsSync;
	var file = 'config/default.js';
	fs.exists(file, function(exists){
		var servers = exists ? require('../config/default').servers : {};
		res.render('index', {title: 'Skyfall', servers: servers});
	});
};


/*
 * GET stack page
 */

exports.stack = function(req, res){
	var stack = req.params.stack;
	var fs = require('fs');
	fs.exists = fs.exists || require('path').exists;
	fs.existsSync = fs.existsSync || require('path').existsSync;
	var file = 'config/' + stack + '.js';
	fs.exists(file, function(exists){
		if(exists){
			var config = require('../config/' + stack);
			if(config.servers){
				res.render('index', {title: 'Skyfall', servers: config.servers});
			}else{
				var header = stack + ' not properly configured';
				res.render('404', { status: 404, url: req.url, header: header });
			}
		}else{
			var header = stack + ' stack not found';
			res.render('404', { status: 404, url: req.url, header: header });
		}
	});
};


/*
 * GET server page
 */

exports.server = function(req, res){
	var split = req.params.server.split(':');
	var address = split[0];
	var port = split.length > 1 ? split[1] : 3007;
	res.render('server', {address: address, port: port});
};