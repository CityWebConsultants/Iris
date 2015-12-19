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

var config = JSON.parse(config);

process.chdir(__dirname + "/../home/sites/" + parameters.site);

var server = require('./boot')(config);
