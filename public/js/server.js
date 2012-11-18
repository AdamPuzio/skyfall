
var ServerMonitor = {
	_servers: {}
	
	, getServer: function(serverName){
		if(this._servers[serverName]) return this._servers[serverName];
		return null;
	}
	
	, addServer: function(serverName, ip, port){
		if(this._servers[serverName]) return;
		
		var socket = io.connect('http://' + ip + ':' + port);
		
		var el = $('#cloneBox .server-load').clone();
		el.appendTo('#serversList');
		
		this._servers[serverName] = {
			name: serverName
			, ip: ip
			, port: port
			, socket: socket
			, el: el
			, cpuTimes: {}
		};
		
		socket.on('sysInfo', $.proxy(this.sysInfo, this._servers[serverName]));
		socket.on('loadInfo', $.proxy(this.loadInfo, this._servers[serverName]));
		socket.on('disconnect', function(){
			
		});
		
		el.find('.icon-play').parent().click($.proxy(function(e){
			e.preventDefault();
			ServerMonitor.startServer(this.name);
		}, this._servers[serverName]));
		el.find('.icon-pause').parent().click($.proxy(function(e){
			e.preventDefault();
			ServerMonitor.stopServer(this.name);
		}, this._servers[serverName]));
	}
	
	, sysInfo: function(data){
		this.el.find('.server-name').html(this.name);
		var cpuContainer = this.el.find('.cpu');
		if(Object.keys(this.cpuTimes).length) return;
		for(var i=0; i<data.cpus.length; i++){
			var el = $('#cloneBox .cpu-bar').clone().addClass('cpu-bar-' + i);
			el.appendTo(cpuContainer);
			this.cpuTimes[i] = {};
		}
	}
	
	, loadInfo: function(data){
		var el = this.el;
		el.find('.load_1min').html(data.loadavg[0].toFixed(2));
		el.find('.load_5min').html(data.loadavg[1].toFixed(2));
		el.find('.load_15min').html(data.loadavg[2].toFixed(2));
		
		var uptime = ServerMonitor._convertTime(data.uptime);
		el.find('.uptime').html(uptime);
		
		for(var i = 0; i < data.cpus.length; i++) {
			var cpu = data.cpus[i], total = 0;
			var prevTimes = this.cpuTimes[i];
			var cpuBar = el.find('.cpu-bar-' + i);
			var times = cpu.times;
			for(type in times){
				var time = Math.abs(times[type]);
				if(prevTimes[type]){
					var typeTime = Math.abs(time - prevTimes[type]);
				}else{
					var typeTime = time;
				}
				total += typeTime;
				this.cpuTimes[i][type] = time;
				times[type] = typeTime;
			}
			
			var user = Math.round(100 * times['user'] / total);
			var sys = Math.round(100 * times['sys'] / total);
			cpuBar.find('.cpu-pct').html((user + sys) + '%');
			cpuBar.find('.user').animate({width: user + '%'});
			cpuBar.find('.system').animate({width: sys + '%'});
		}
	}
	
	, startServer: function(serverName){
		var server = this.getServer(serverName);
		server.socket.emit('start');
		server.el.removeClass('inactive');
		server.el.find('.icon-play').addClass('hidden');
		server.el.find('.icon-pause').removeClass('hidden');
	}
	
	, stopServer: function(serverName){
		var server = this.getServer(serverName);
		server.socket.emit('stop');
		server.el.addClass('inactive');
		server.el.find('.icon-play').removeClass('hidden');
		server.el.find('.icon-pause').addClass('hidden');
	}
	
	, startAll: function(){
		for(var i=0; i<this._servers.length; i++){
			this.startServer(this._servers[i].name);
		}
	}
	
	, stopAll: function(){
		for(var i=0; i<this._servers.length; i++){
			this.stopServer(this._servers[i].name);
		}
	}
	
	, _convertTime: function(ts){
		var totalSec = ts;
		days = parseInt( totalSec / 86400 );
		hours = parseInt( totalSec / 3600 ) % 24;
		minutes = parseInt( totalSec / 60 ) % 60;
		seconds = totalSec % 60;
		
		result = (days > 0 ? days + ' days ' : '') + (hours < 10 ? "0" + hours : hours) + "hrs " + (minutes < 10 ? "0" + minutes : minutes) + "min " + (seconds  < 10 ? "0" + seconds : seconds) + 'sec';
		return result;
	}
};


$(document).ready(function(){
	ServerMonitor.addServer('Localhost', 'localhost', 3007);
	
});
