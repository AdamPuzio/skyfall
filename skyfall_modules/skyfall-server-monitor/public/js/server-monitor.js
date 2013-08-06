$(function(){
	Skyfall.registerModule('skyfall-server-monitor', {
		rendered: false
		, mainTpl: '#tpl_server_monitor'
		, cpuTpl: '#tpl_server_monitor_progress'
		
		, cpuTimes: {}
		
		, initialize: function(cfg){
			this.mainTpl = this.template(this.mainTpl);
			this.cpuTpl = this.template(this.cpuTpl);
			this.el = $(cfg.satelliteEl).find('.panel-body').append(this.mainTpl);
		}
		
		, render: function(data){
			var $el = $(this.el);
			var $cpusEl = $el.find('.cpus');
			$(this.cpuTpl).appendTo($el.find('.cpus-all'));
			var cpus = data.cpus.length;
			for(var i=0; i<cpus; i++){
				var cpuEl = $(this.cpuTpl).addClass('cpu-' + i).appendTo($cpusEl);
				this.cpuTimes[i] = {};
			}
			var limit = 4;
			if(cpus > 32){
				limit = 64;
			}else if(cpus > 16){
				limit = 32;
			}else if(cpus > 8){
				limit = 16;
			}else if(cpus > 4){
				limit = 8;
			}
			$cpusEl.addClass('limit' + limit);
			
			this.rendered = true;
		}
		
		, update: function(data){
			var $el = $(this.el);
			if(!this.rendered) this.render(data);
			
			this.loadInfo(data);
			this.memory(data);
			this.diskspace(data);
			this.uptime(data);
		}
		
		, uptime: function(data){
			var $el = $(this.el);
			var ts = data.uptime;
			//days = parseInt(ts / 86400);
			//hours = parseInt(ts / 3600) % 24;
			//minutes = parseInt(ts / 60) % 60;
			//seconds = parseInt(ts % 60);
			//var uptime = (days > 0 ? days + ' days ' : '') + (hours < 10 ? "0" + hours : hours) + "hrs " + (minutes < 10 ? "0" + minutes : minutes) + "min " + (seconds  < 10 ? "0" + seconds : seconds) + 'sec';
			var uptime = moment.duration(ts, 'seconds').humanize();
			$el.find('.uptime').html('Uptime: ' + uptime);
		}
		
		, loadInfo: function(data){
			var $el = $(this.el);
			var animate = Skyfall.Settings.animation;
			var simpleMode = Skyfall.Settings.simpleMode;
			
			var ts = moment(data.ts).format('MMMM Do YYYY, h:mm:ss a');
			$el.find('.ts').html('Updated: ' + ts);
			$el.find('.load-1min').html(data.loadavg[0].toFixed(2));
			$el.find('.load-5min').html(data.loadavg[1].toFixed(2));
			$el.find('.load-15min').html(data.loadavg[2].toFixed(2));
			
			var totalAll = 0, timesAll = {};
			var cpus = data.cpus.length;
			for(var i=0; i<cpus; i++){
				var cpu = data.cpus[i], total = 0;
				var total = 0;
				var cpuBar = $el.find('.cpus .cpu-' + i);
				var prevTimes = this.cpuTimes[i];
				var times = cpu.times;
				for(type in times){
					var time = Math.abs(times[type]);
					if(prevTimes && prevTimes[type]){
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
				var user = Math.round(100 * times['user'] / total);
				var sys = Math.round(100 * times['sys'] / total);
				//cpuBar.find('.cpu-pct').html((user + sys) + '%');
				if(!simpleMode){
					if(animate === true){
						cpuBar.find('.cpu-user').animate({width: user + '%'});
						cpuBar.find('.cpu-sys').animate({width: sys + '%'});
					}else{
						cpuBar.find('.cpu-user').css({width: user + '%'});
						cpuBar.find('.cpu-sys').css({width: sys + '%'});
					}
				}
			}
			var cpuBar = $el.find('.cpus-all');
			var user = Math.round(100 * timesAll['user'] / (total * data.cpus.length));
			var sys = Math.round(100 * timesAll['sys'] / (total * data.cpus.length));
			//cpuBar.find('.cpu-pct').html((user + sys) + '%');
			
			if(animate === true){
				cpuBar.find('.cpu-user').animate({width: user + '%'});
				cpuBar.find('.cpu-sys').animate({width: sys + '%'});
			}else{
				cpuBar.find('.cpu-user').css({width: user + '%'});
				cpuBar.find('.cpu-sys').css({width: sys + '%'});
			}
		}
		
		, memory: function(data){
			var $el = $(this.el);
			var used = data.totalmem - data.freemem;
			var pct = data.totalmem > 0 ? Math.round((used / data.totalmem) * 100) : 0;
			$el.find('.memory .title').html('M: ' + pct + '%');
			$el.find('.memory .progress-bar').css({width: pct + '%'});
		}

		, diskspace: function(data){
			var $el = $(this.el);
			var used = data.total - data.free;
			var pct = data.total > 0 ? Math.round((used / data.total) * 100) : 0;
			$el.find('.diskspace .title').html('D: ' + pct + '%');
			$el.find('.diskspace .progress-bar').css({width: pct + '%'});
		}
	});
});