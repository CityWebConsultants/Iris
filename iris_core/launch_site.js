/**
 * @file Launches Iris with the settings and context of the given site.
 */

// Change process directory to current site

var parameters = {};

process.argv.forEach(function (val, index, array) {

  if (val.indexOf("=") !== -1) {
    val = val.split("=");
    parameters[val[0]] = val[1];
  }

});

var fs = require("fs");

var config;

try {

  config = fs.readFileSync(__dirname + "/../home/sites/" + parameters.site + "/settings.json", "utf8");

} catch (e) {

  console.log("* Failed to launch. '" + parameters.site + "' isn't a valid sitename. Or there isn't a settings.json file in that site's directory. Check you are using the correct site name or create a sites folder with a valid settings.json file (copy it from the default site folder) in the home/sites directory. *")
  process.exit();

}

process.on("unhandledRejection", function (e) {

  if (e.stack) {

    e.stack.forEach(function (error, index) {

      var error = "Error on line " + e.stack[index].getLineNumber() + " of " + e.stack[index].getFileName() + " " + e.message;

      console.error(error);

      if (iris.log) {

        iris.log("info", error);

      }

    })


  }

})

process.on("uncaughtException", function (e) {

  if (Array.isArray(e.stack)) {

    var errorMessage = '';

    e.stack.forEach(function (error, index) {

      errorMessage += "Error on line " + e.stack[index].getLineNumber() + " of " + e.stack[index].getFileName() + " " + e.message + '\n';

    })

    console.error(errorMessage);

    if (iris.log) {

      iris.log("fatal", errorMessage);

    }

  } else {

    console.log(e);

  }

  process.send("restart");

})

var config = JSON.parse(config);

process.chdir(__dirname + "/../home/sites/" + parameters.site);

var server = require('./boot')(config);
