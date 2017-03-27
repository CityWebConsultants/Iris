/**
 * @file Launch script run by user to start an Iris site. Keeps sessions persistent by managing a sub-process.
 * Launch.js is the parent process that remains persistant even if there is a fatal error or the server is 
 * restarted via the admin form. The parent process forks a child process to load the actual site.
 */

if (process.running) {

  module.exports = function () {

    return new Promise(function (resolve, reject) {

      resolve(iris);

    })

  }

} else {

  module.exports = function (parameters) {

    if (!parameters) {

      parameters = {};

    }

    parameters.launchFile = module.parent.filename;
    parameters.launchPath = process.cwd();

    // Create a unique process ID for the instance

    var crypto = require("crypto");

    parameters.processID = crypto.randomBytes(8).toString('hex');

    process.argv.forEach(function (val, index, array) {

      if (val.indexOf("=") !== -1) {
        val = val.split("=");
        parameters[val[0]] = val[1];
      }

    });

    var fork = require('child_process').fork;

    // Check how many restarts have been performed to catch startup restart loops

    var restartCounter = 2;

    var persistentData = {};

    var start = function () {

      var options = {
        env: {
          'NODE_ENV': process.env.NODE_ENV
        }
      };

      process.argv.forEach(function (item) {
        var itemParts = item.split("=");
        if (itemParts[0] == "--debug-port") {
          options.execArgv = ['--debug=' + itemParts[1]];
        }
      });

      var sub = fork(__dirname + "/launch_site.js", [], options);

      sub.send(parameters);

      sub.on('message', function (cmd) {

        if (cmd === 'started') {

          restartCounter = 0;

          // Passes persistant sessions and messages to child process.
          sub.send({
            persist: persistentData
          });

        }

        if (cmd.restart) {

          sub.on('exit', function () {

            if (restartCounter > 1) {

              console.error("Too many restarts. Error on startup.");
              process.exit();

            } else {

              persistentData = cmd.restart;
              start();

            }

            restartCounter += 1;

          });
          sub.kill();
        }

      });

    };

    start();

    return new Promise(function (pass, fail) {

      // Dummy, not loaded yet.

    });

  };
}
