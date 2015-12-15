// Change process directory to current site

var parameters = {};

process.argv.forEach(function (val, index, array) {

  if (val.indexOf("=") !== -1) {
    val = val.split("=");
    parameters[val[0]] = val[1];
  }

});

var fs = require("fs");

var config = JSON.parse(fs.readFileSync(__dirname + "/sites/" + parameters.site + "/settings.json", "utf8"));

process.chdir(__dirname + "/sites/" + parameters.site);

var server = require('./boot')(config);
