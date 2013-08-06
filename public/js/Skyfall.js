
var Skyfall = _.extend({
	Models: {}
	, Collections: {}
	, Views: {}
	, Servers: {}
	, Modules: {}
	
	, Settings: {
		animation: false
		, simpleMode: false
	}
	
	, launch: function(opts, cb){
		var self = this;
		Skyfall.Core = new Skyfall.Models.Core(opts);
		this.Satellites = new Skyfall.Collections.Satellites([], {});
		
		this.Dashboard = new Skyfall.Views.Dashboard({
			el: $('#dashboard')
		});
		
		var tplContainer = $('<div></div>').appendTo('body');
		for(var i=0; i<opts.templates.length; i++){
			var tpl = opts.templates[i];
			$('<div></div>').load(tpl).appendTo('#templates');
		}
		
		$('<div></div>').load('/tpl/templates.html', function(){
			self.trigger('ready', self);
			if(cb) cb();
		}).appendTo('#templates');
	}
	
	, setting: function(setting, value){
		this.Settings[setting] = value;
		this.trigger('settings-change', {setting: setting, value: value});
	}
	
	, addSatellites: function(obj){
		for(var satName in obj){
			var satInfo = {
				name: satName
				, host: null
				, port: 3307
			};
			var satObj = obj[satName];
			switch(typeof satObj){
				case 'object':
					satInfo = _.extend(satInfo, satObj);
					break;
				case 'string':
					var satEx = satObj.split(':');
					satInfo.host = satEx[0];
					if(satEx.length > 1) satInfo.port = satEx[1];
					break;
			}
			Skyfall.addSatellite(satInfo.name, satInfo.host, satInfo.port);
		}
	}
	
	, addSatellite: function(name, host, port){
		var satelliteObj = {
			name: name
			, host: host
			, port: port || 3007
		};
		var satellite = new Skyfall.Models.Satellite(satelliteObj, {});
		this.Satellites.add(satellite);
		return satellite;
	}
	
	, registerModule: function(modname, modObj){
		this.Modules[modname] = Skyfall.Models.Module.extend(modObj);
	}
	
	, getModule: function(modname){
		return this.Modules[modname];
	}
	
	, log: function(v){
		if(window.console) console.log(v);
	}
	
	, error: function(v){
		if(window.console) console.error(v);
	}
}, Backbone.Events);


	
/**
 * Meeting Model
 * 
 * Events:
 *    launch
 */
Skyfall.Models.Core = Backbone.Model.extend({
	defaults: {
		socketUrl: null
	}
	
	, initialize: function(){
		this.Socket = io.connect(this.attributes.socketUrl);
		
		this.registerSocketEvents();
		this.registerEvents();
		
		this.auth();
	}
	
	, auth: function(cb){
		
	}
	
	, registerSocketEvents: function(){
		var socket = this.Socket;
		var self = this;
		
		// We are grabbing all connection socket events and firing them as our own
		socket.on('connect', function(){ self.trigger('connect', arguments); });
		socket.on('connecting', function(){ self.trigger('connecting', arguments); });
		socket.on('connect_failed', function(){ self.trigger('connect_failed', arguments); });
		socket.on('disconnect', function(){ self.trigger('disconnect', arguments); });
		socket.on('reconnect', function(){ self.trigger('reconnect', arguments); });
		socket.on('reconnecting', function(){ self.trigger('reconnecting', arguments); });
		socket.on('reconnect_failed', function(){ self.trigger('reconnect_failed', arguments); });
		socket.on('error', function(){ self.trigger('error', arguments); });
		
		socket.on('event', function(event, data){
			var server = event.server;
			var mod = event.mod;
			Skyfall.Satellites.handleEvent(server, mod, data);
		});
	}
	
	, registerEvents: function(){
		var self = this;
		this.on('disconnect', function(){
			Skyfall.log('You have been disconnected...');
		});
		this.on('reconnecting', function(){
			Skyfall.log('Reconnecting...');
		});
		this.on('reconnect', function(){
			self.auth();
		});
	}
});


Skyfall.Models.Satellite = Backbone.Model.extend({
	defaults: {
		
	}
	
	, Modules: {}
	
	, initialize: function(){
		var self = this;
		var atts = this.attributes;
		var server = this.attributes.server = atts.host + ':' + atts.port;
		Skyfall.Servers[server] = this;
		Skyfall.log('Registering to ' + server);
		Skyfall.Core.Socket.emit('register', server, function(mods){
			Skyfall.Dashboard.addSatellite(self);
			self.attributes.modules = mods;
			self.setModules();
		});
	}
	
	, setModules: function(){
		var mods = this.attributes.modules;
		for(var i=0; i<mods.length; i++){
			var modname = mods[i];
			if(Skyfall.Modules[modname]){
				this.subscribe(modname);
			}
		}
	}
	
	, subscribe: function(modname){
		Skyfall.log('Subscribing to ' + modname + ' on server ' + this.attributes.server);
		Skyfall.Core.Socket.on(modname, this.handleEvent);
		Skyfall.Core.Socket.emit('subscribe', this.attributes.server, modname, function(modname, data){
			// Subscribed
			
		});
		this.Modules[modname] = new Skyfall.Modules[modname]({
			satellite: this
			, satelliteEl: this.el
		});
	}
	
	, unsubscribe: function(modname){
		Skyfall.Core.Socket.emit('unsubscribe', this.attributes.server, modname, function(){
			
		});
	}
	
	, handleEvent: function(mod, data){
		if(Skyfall.Modules[mod]){
			var module = this.Modules[mod];
			module.update(data);
		}
	}
});

Skyfall.Collections.Satellites = Backbone.Collection.extend({
	model: Skyfall.Models.Satellite
	
	, defaults: {
		
	}
	
	, initialize: function(models, opts){
		
	}
	
	, handleEvent: function(server, mod, data){
		var satellite = Skyfall.Servers[server];
		if(!satellite){
			Skyfall.error('Server ' + server + ' is not registered');
			return;
		}
		satellite.handleEvent(mod, data);
	}
});

/**
 * Dashboard View
 */
Skyfall.Views.Dashboard = Backbone.View.extend({
	defaults: {
		
	}
	
	, events: {
		
	}
	
	, initialize: function(){
		if(Skyfall.Settings.simpleMode === true){
			$(this.el).addClass('simple-mode');
		}
	}
	
	, addSatellite: function(satellite, m){
		var view = new Skyfall.Views.SatelliteView({
			model: satellite
		});
		var el = satellite.el = view.render().el;
		$(this.el).append(el);
	}
});

/**
 * Satellite View
 */
Skyfall.Views.SatelliteView = Backbone.View.extend({
	tagName: 'div'
	, className: 'satellite'
	
	, defaults: {
		
	}
	
	, events: {
		
	}
	
	, initialize: function(){
		this.template = _.template($('#satellite_template').html());
	}
	
	, render: function() {
		var varObj = this.model.toJSON();
		this.$el.html(this.template(varObj));
		this.$el.attr('data-satellite-id', this.model.cid);
		return this;
	}
	
	, addSatellite: function(satellite, m){
		
	}
});

Skyfall.Models.Module = Backbone.Model.extend({
	defaults: {
		
	}
	
	, initialize: function(cfg){
		var el = this.el = $('<li class="list-group-item"></li>');
		$(this.attributes.satelliteEl).find('.panel-items').append(el);
	}
	
	, update: function(data){
		
	}
	
	, template: function(tpl, obj){
		if(!obj) obj = {};
		var template = _.template($(tpl).html(), obj);
		return template;
	}
});