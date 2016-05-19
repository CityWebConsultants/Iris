#! /usr/bin/env node

var cli = {};
var prompt = require("prompt");
var fs = require("fs");
var toSource = require("tosource");
prompt.colors = false;

cli.install = function (configSavePath) {

  prompt.start();

  var schema = {
    properties: {
      sitePath: {
        description: "Enter the path you wish to save your path config",
        default: "/mysite",
      },
      port: {
        type: "integer",
        default: "4000",
        description: "which port do you wish to run the iris server on?"
      },
      https: {
        description: "Do you wish to use HTTPS? (true/false)",
        required: true,
        type: "boolean",
        default: false
      },
      db_server: {
        "description": "Where is the MongoDB database running?",
        "default": "localhost"
      },
      db_port: {
        "description": "Which port is the database running on? Enter 0 to skip.",
        "default": 27017
      },
      db_name: {
        "description": "what do you want the database name to be? Enter 0 to skip.",
        "default": "iris"
      },
      "max_file_size": {
        "description": "max file size",
        "type": "integer",
        "default": 10
      }
    }
  };

  prompt.get(schema, function (err, result) {
    if (err) {
      console.error(err);
      process.exit();
    }

    if (parseInt(result.db_port) === 0) {

      delete result.db_port;

    }

    if (parseInt(result.db_name) === 0) {

      delete result.db_name;

    }

    var installIris = {
      properties: {
        install: {
          description: "Install iris packages?",
          type: "boolean",
          default: true
        }
      }
    };

    prompt.get(installIris, function (err, install) {

      var saveLaunchFile = function () {

        var launchFile = configSavePath[0] || "iris";

        var file = `require("irisjs")(${toSource(result)});`

        fs.writeFileSync(launchFile + ".js", file);

        console.log("Run 'node " + launchFile + "' to launch");

      }

      if (install.install) {

        console.log("installing Iris");

        var exec = require('child_process').exec,
          child;

        child = exec('npm install irisjs',
          function (error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
              console.log('exec error: ' + error);
            }
          });

        child.on("close", function () {

          saveLaunchFile();

        })

      } else {

        saveLaunchFile();

      }

    })

  });

}

// Run script 

var userArgs = process.argv.slice(2);

try {

  var first = userArgs[0];

  var rest = userArgs.slice(1);

  cli[first](rest);

} catch (e) {

  console.error(e);

}
