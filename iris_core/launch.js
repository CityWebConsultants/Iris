/**
 * @file Launch script run by user to start an Iris site. Keeps sessions persistent by managing a sub-process.
 */

var parameters = {};

process.argv.forEach(function (val, index, array) {

  if (val.indexOf("=") !== -1) {
    val = val.split("=");
    parameters[val[0]] = val[1];
  }

});

// Persistent sessions

var sessions = {};
var messages = {};

if (parameters.site) {

  var fork = require('child_process').fork;

  // Check how many restarts have been performed to catch startup restart loops

  var restartCounter = 2;

  start = function () {

    var sub = fork(__dirname + "/launch_site.js", process.argv.slice(2), {
      env: {
        'NODE_ENV': process.env.NODE_ENV
      }
    });

    sub.on('message', function (cmd) {

      if (cmd === 'started') {

        restartCounter = 0;

        sub.send({
          sessions: sessions,
          messages: messages
        });

      };

      if (cmd === 'restart') {
        sub.on('exit', function () {

          if (restartCounter > 1) {

            console.error("Too many restarts. Error on startup.")
            process.exit();

          } else {

            start();

          }

          restartCounter += 1;

        });
        sub.kill();
      }

      if (cmd.sessions) {

        sessions = cmd.sessions;

      }

      if (cmd.messages) {

        messages = cmd.messages

      }

    });

  };

  start();

} else {

  console.log("* Failed to launch. Please provide a site with a paramater. For example 'node iris.js site=YOURSITENAME' *");

}
