/*jslint nomen: true, node:true */
"use strict";

var version = "RC1";

module.exports = function (config) {

  //Fetch command line paramaters

  var paramaters = {};

  process.argv.forEach(function (val, index, array) {

    if (val.indexOf("=") !== -1) {
      val = val.split("=");
      paramaters[val[0]] = val[1];
    }

  });

  //Get any config paramaters passed through via the command line and set them.

  if (Object.keys(paramaters).length > 0) {
    console.log("Command line arguments: ");
    console.log(paramaters);

    Object.keys(paramaters).forEach(function (paramater) {

      config[paramater] = paramaters[paramater];

    })

  }

  //Create global object for the application

  global.C = {};

  //Store config object for global use (this has now been updated with the additional paramaters.

  C.config = config;

  config.version = version;

  //Store the roles and permissions object from the lanched site

  C.roles = config.roles;

  console.log("\nLaunching server: " + config.version + "\n");

  //Hook system

  C.hook = require('./hook');

  //Promisechains

  C.promiseChain = function (tasks, parameters, success, fail) {

    tasks.reduce(function (cur, next) {
      return cur.then(next);
    }, Promise.resolve(parameters)).then(success, fail);

  };

  //Require HTTP sever

  require('./server');

  //Load in module system

  require('./modules');

  //Set up database

  require('./db');

  //Core modules

  require('./core_modules/auth/auth');

  //Loop over enabled modules in site config

  config.modules.forEach(function (item) {

    if (item.enabled) {
      require(item.path + '/' + item.name + '/' + item.name);
    }

  });

};
