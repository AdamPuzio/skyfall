var path = require('path')
	, nconf = require('nconf')
	, Skyfall = require('./Skyfall.js');

nconf.argv().env();

console.log('Loading configuration...');

if(nconf.get('NODE_ENV')){
	var conf = nconf.get('NODE_ENV');
	console.log('Loading ' + conf + ' configuration');
	nconf.file({ file: '../config/env/' + conf + '.json' });
}else if(nconf.get('config')){
	var conf = nconf.get('config');
	console.log('Loading ' + conf + ' configuration');
	nconf.file({ file: '../config/' + conf + '.json' });
}else{
	nconf.file({ file: '../config/config.json' });
}

nconf.defaults({
	server: {
		port: 3000
		, logLevel: 0
		, secret: 'skyfall007'
	}
	, satellite: {
		port: 3007
		, logLevel: 0
	}
	, modules: '*'
	, mainDir: path.dirname(__dirname)
});
var config = nconf.get();

module.exports = config;