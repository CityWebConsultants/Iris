var parameters = {};

process.argv.forEach(function (val, index, array) {

  if (val.indexOf("=") !== -1) {
    val = val.split("=");
    parameters[val[0]] = val[1];
  }

});

// Persistent sessions

var sessions = {};

if (parameters.site) {

  var fork = require('child_process').fork;

  start = function () {

    var sub = fork(__dirname + "/launch_site.js", process.argv.slice(2), {
      env: {
        'NODE_ENV': process.env.NODE_ENV
      }
    });

    sub.on('message', function (cmd) {

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
