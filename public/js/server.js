


$(document).ready(function(){
	$('#addServerForm .btn').click(function(e){
		e.preventDefault();
		var name = $('#addServerForm input[name="name"]').val();
		var ip = $('#addServerForm input[name="ip"]').val();
		var port = $('#addServerForm input[name="port"]').val();
		Skyfall.addServer(name, ip, port);
	});
	
	$('.server-settings input[name="warning-level"]').blur(function(){
		Skyfall._settings.warningLevel = $(this).val();
	});
	
	$('.simple-mode').click(function(e){
		var simpleMode = !$(this).hasClass('active');
		if(simpleMode){
			$('.server-load').addClass('simple-mode');
		}else{
			$('.server-load').removeClass('simple-mode');
		}
	});
	
	$('.animate').click(function(e){
		var animate = !$(this).hasClass('active');
		Skyfall._settings.animate = animate;
	});
	
	$('[rel="tooltip"]').livequery(function(){
		$(this).tooltip();
	});
});
