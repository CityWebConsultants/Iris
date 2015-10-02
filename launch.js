var paramaters = {};

process.argv.forEach(function (val, index, array) {

  if (val.indexOf("=") !== -1) {
    val = val.split("=");
    paramaters[val[0]] = val[1];
  }

});

// Persistent sessions

var sessions = {};

if (paramaters.site) {

  var site = "/sites/" + paramaters.site + "/launch.js";

  var fork = require('child_process').fork;

  start = function () {

    var sub = fork(__dirname + site, process.argv.slice(2), {
      env: {
        'NODE_ENV': process.env.NODE_ENV
      }
    });

    sub.on('message', function (cmd) {
      
      console.log(cmd);

      if (cmd === 'started') {

        sub.send({
          sessions: sessions
        });

      };

      if (cmd === 'restart') {
        sub.on('exit', function () {
          start();
        });
        sub.kill();
      }

      if (cmd.sessions) {
        
        sessions = cmd.sessions;
        
      };

    });

  };

  start();

} else {

  console.log("Please provide a site");

}
