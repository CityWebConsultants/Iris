  var paramaters = {};

  process.argv.forEach(function (val, index, array) {

    if (val.indexOf("=") !== -1) {
      val = val.split("=");
      paramaters[val[0]] = val[1];
    }

  });

  if (paramaters.site) {

    var site = "/sites/" + paramaters.site + "/launch.js";

    var fork = require('child_process').fork;

    start = function () {

      var sub = fork(__dirname + site, [], {
        env: {
          'NODE_ENV': process.env.NODE_ENV
        }
      });

      sub.on('message', function (cmd) {
        if (cmd === 'restart') {
          sub.on('exit', function () {
            start();
          });
          sub.kill();
        }
      });

    };

    start();

  } else {

    console.log("Please provide a site");

  }
