  var paramaters = {};

  process.argv.forEach(function (val, index, array) {

    if (val.indexOf("=") !== -1) {
      val = val.split("=");
      paramaters[val[0]] = val[1];
    }

  });

  if (paramaters.site) {

    var site = __dirname + "/sites/" + paramaters.site + "/launch.js";
    
    var exec = require('child_process').exec;

    exec('node ' + site, function (error, stdout, stderr) {
      console.log('stdout: ', stdout);
      console.log('stderr: ', stderr);
      if (error !== null) {
        console.log('exec error: ', error);
      }
    });

  } else {

    console.log("Please provide a site");

  }
