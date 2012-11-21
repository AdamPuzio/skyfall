
var ServerMonitor = {
	_servers: {}
	, _settings: {
		animate: true
		, warningLevel: 40
	}
	
	, getServer: function(serverName){
		if(this._servers[serverName]) return this._servers[serverName];
		return null;
	}
	
	, addServer: function(serverName, ip, port, start){
		if(!start) start = true;
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
		socket.on('diskspace', $.proxy(this.diskspace, this._servers[serverName]));
		socket.on('disconnect', $.proxy(function(){
			if(console) console.log('disconnected from ' + this.name);
			ServerMonitor.stopServer(this.name, this.key);
		}, this._servers[serverName]));
		
		el.find('.icon-play').parent().click($.proxy(function(e){
			e.preventDefault();
			ServerMonitor.startServer(this.name);
		}, this._servers[serverName]));
		el.find('.icon-pause').parent().click($.proxy(function(e){
			e.preventDefault();
			ServerMonitor.stopServer(this.name);
		}, this._servers[serverName]));
		el.find('.icon-remove').parent().click($.proxy(function(e){
			e.preventDefault();
			ServerMonitor.removeServer(this.name);
		}, this._servers[serverName]));
		if(start) this.startServer(serverName);
	}
	
	, sysInfo: function(data){
		this.key = data.key;
		this.el.find('.server-name').html(this.name);
		var cpuContainer = this.el.find('.cpu');
		if(Object.keys(this.cpuTimes).length) return;
		
		this.el.find('.cpu').addClass('cpu-' + data.cpus.length);
		$('#cloneBox .cpu-bar').clone().addClass('cpu-bar-all').appendTo(this.el.find('.cpu-all'));
		
		for(var i=0; i<data.cpus.length; i++){
			var el = $('#cloneBox .cpu-bar').clone().addClass('cpu-bar-' + i).attr('title', 'CPU Load (#' + (i + 1) + ')');
			el.appendTo(cpuContainer);
			this.cpuTimes[i] = {};
		}
	}
	
	, loadInfo: function(data){
		var el = this.el;
		var showAdvanced = el.find('.cpu').css('display') != 'none';
		el.find('.load_1min').html(data.loadavg[0].toFixed(2));
		el.find('.load_5min').html(data.loadavg[1].toFixed(2));
		el.find('.load_15min').html(data.loadavg[2].toFixed(2));
		if(data.loadavg[0] >= ServerMonitor._settings.warningLevel){
			el.addClass('warning');
		}else{
			el.removeClass('warning');
		}
		
		var uptime = ServerMonitor._convertTime(data.uptime);
		el.find('.uptime').html(uptime);
		
		var totalAll = 0, timesAll = {};
		
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
				totalAll += typeTime;
				if(!timesAll[type]) timesAll[type] = 0;
				timesAll[type] += typeTime;
			}
			
			if(showAdvanced){
				var user = Math.round(100 * times['user'] / total);
				var sys = Math.round(100 * times['sys'] / total);
				cpuBar.find('.cpu-pct').html((user + sys) + '%');
				cpuBar.find('.user').animate({width: user + '%'});
				cpuBar.find('.system').animate({width: sys + '%'});
			}
		}
		var cpuBar = el.find('.cpu-bar-all');
		var user = Math.round(100 * timesAll['user'] / (total * data.cpus.length));
		var sys = Math.round(100 * timesAll['sys'] / (total * data.cpus.length));
		cpuBar.find('.cpu-pct').html((user + sys) + '%');
		
		if(ServerMonitor._settings.animate === true){
			cpuBar.find('.user').animate({width: user + '%'});
			cpuBar.find('.system').animate({width: sys + '%'});
		}else{
			cpuBar.find('.user').css({width: user + '%'});
			cpuBar.find('.system').css({width: sys + '%'});
		}
		var used = data.totalmem - data.freemem;
		var pct = data.totalmem > 0 ? (used / data.totalmem).toFixed(2) * 100 : 0;
		el.find('.memory').html('M: ' + pct + '%');
		this.el.find('.memory-bar').css({width: pct + '%'});
	}
	
	, diskspace: function(data){
		var used = data.total - data.free;
		var pct = data.total > 0 ? (used / data.total).toFixed(2) * 100 : 0;
		this.el.find('.diskspace').html('D: ' + pct + '%');
		this.el.find('.diskspace-bar').css({width: pct + '%'});
	}
	
	, startServer: function(serverName){
		var server = ServerMonitor.getServer(serverName);
		server.socket.emit('start', {key: server.key});
		server.el.removeClass('inactive');
		server.el.find('.icon-play').addClass('hidden');
		server.el.find('.icon-pause').removeClass('hidden');
	}
	
	, stopServer: function(serverName){
		var server = ServerMonitor.getServer(serverName);
		server.socket.emit('stop', {key: server.key});
		server.el.addClass('inactive');
		server.el.find('.icon-play').removeClass('hidden');
		server.el.find('.icon-pause').addClass('hidden');
	}
	
	, removeServer: function(serverName){
		var server = ServerMonitor.getServer(serverName);
		server.socket.emit('stop', {key: server.key});
		server.el.remove();
		delete this._servers[serverName];
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
		days = parseInt(totalSec / 86400);
		hours = parseInt(totalSec / 3600) % 24;
		minutes = parseInt(totalSec / 60) % 60;
		seconds = parseInt(totalSec % 60);
		
		result = (days > 0 ? days + ' days ' : '') + (hours < 10 ? "0" + hours : hours) + "hrs " + (minutes < 10 ? "0" + minutes : minutes) + "min " + (seconds  < 10 ? "0" + seconds : seconds) + 'sec';
		return result;
	}
};


$(document).ready(function(){
	for(var name in servers){
		var address = servers[name]['address'];
		var port = servers[name]['port'];
		ServerMonitor.addServer(name, address, port);
	}
	
	$('#addServerForm .btn').click(function(e){
		e.preventDefault();
		var name = $('#addServerForm input[name="name"]').val();
		var ip = $('#addServerForm input[name="ip"]').val();
		var port = $('#addServerForm input[name="port"]').val();
		ServerMonitor.addServer(name, ip, port);
	});
	
	$('.server-settings input[name="animate"]').change(function(){
		ServerMonitor._settings.animate = $(this).attr('checked') == 'checked';
	});
	
	$('.server-settings input[name="warning-level"]').blur(function(){
		ServerMonitor._settings.warningLevel = $(this).val();
	});
	
	$('[rel="tooltip"]').livequery(function(){
		$(this).tooltip();
	});
});
