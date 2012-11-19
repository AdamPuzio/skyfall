
exports.fall = function(){
  var pollRequestId = null

  , startRequest = function(socket, interval){
      if(!interval) interval = 2000;
      var sysInfo = {
        hostname: os.hostname()
        , type: os.type()
        , platform: os.platform()
        , arch: os.arch()
        , release: os.release()
        , cpus: os.cpus()
      };
      socket.emit('sysInfo', sysInfo);
      pollRequestId = setInterval(function()  {
        var output = {
          ts: new Date().toJSON()
          , uptime: os.uptime()
          , loadavg: os.loadavg()
          , totalmem: os.totalmem()
          , freemem: os.freemem()
          , cpus: os.cpus()
          , networkInterfaces: os.networkInterfaces()
        };
        socket.emit('loadInfo', output);
      }, interval);
  }
  , stopRequest = function(){
      clearInterval(pollRequestId);
      pollRequestId = null;

  }
  , init = function(io){
    io.sockets.on('connection', function (socket) {
      socket.on('start', function (data) {
        startRequest(socket);
      });
      socket.on('stop', function (data) {
        stopRequest();
      });
      socket.on('disconnect', function(){
        stopRequest();
      });
    });

  };
  return {
    start:init
  }
}();
