var nconf = require('nconf');

nconf.overrides({
	satellite: false
});

require('./app');