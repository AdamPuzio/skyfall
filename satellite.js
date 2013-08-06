var nconf = require('nconf');

nconf.overrides({
	server: false
});

require('./app');