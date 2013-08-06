var config = require('./lib/SkyfallConfig')
	, Skyfall = require('./lib/Skyfall');

Skyfall.boot(__dirname, config, function(){
	if(config.server){
		console.log('Loading Skyfall server');
		require('./interfaces/server-ui')(config);
	}
	
	if(config.satellite){
		console.log('Loading Skyfall satellite');
		require('./interfaces/satellite')(config);
	}
});

