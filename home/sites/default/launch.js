// Change process directory to current site

var fs = require("fs");

var config = JSON.parse(fs.readFileSync(__dirname + "/settings.json", "utf8"));

process.chdir(__dirname);

var server = require('../../boot')(config);
