
/*
 * GET home page.
 */

exports.index = function(req, res){
	var fs = require('fs');
	var file = 'config/servers.js';
	fs.exists(file, function(exists){
		var servers = exists ? require('../config/servers').servers : {};
		res.render('index', {title: 'Skyfall', servers: servers});
	});
};