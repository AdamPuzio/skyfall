
/*
 * GET home page.
 */

exports.index = function(req, res){
	var fs = require('fs');
	var file = 'config/servers.js';
	fs.exists(file, function(exists){
		var servers = exists ? require('../config/servers').servers : {};
		console.log(servers);
		console.log(JSON.stringify(servers));
		res.render('index', {title: 'Skyfall', servers: servers});
	});
};