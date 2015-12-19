// Install script to load in module dependencies of other iris modules

var glob = require("glob");
var npm = require("npm");
var npm = require("npm");
var fs = require("fs");

var coreModuleFiles = glob.sync(__dirname + "/modules/" + "**/package.json");

var toInstall = [];

coreModuleFiles.forEach(function (file) {

  var file = fs.readFileSync(file, "utf-8");

  var file = JSON.parse(file);

  if (file.dependencies) {

    toInstall.push(Object.keys(file.dependencies));

  }

})

npm.load(function (err) {
  // catch errors

  toInstall.forEach(function (installing) {

    npm.commands.install(installing, function (er, data) {

      if (err) {

        console.log(err);

      } else {

        console.log(data)

      }

    });

  });

  npm.on("log", function (message) {
    // log the progress of the installation
    console.log(message);
  });
});
