/*jslint nomen: true, node:true */
"use strict";

var version = "RC1";

module.exports = function (config) {

  //Create global object for the application

  global.C = {};
  
  //Load logging module

  require('./log');

  var path = require('path');

  C.sitePath = process.cwd();

  C.configPath = path.join(C.sitePath, config.configurations_path);

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

  //Store config object for global use 

  C.config = config;

  config.version = version;

  console.log("\nLaunching server: " + config.version + "\n");

  //Hook system

  C.hook = require('./hook');

  //Load in helper utilities

  require('./utils');

  //Require HTTP sever

  require('./server');

  //Load in module system

  require('./modules');

  //Set up database

  require('./db');

  //Load testing module

  require('./testing');

  //Free C object, no longer extensible

  Object.freeze(C);

  //Core modules

  var coreModules = [

    {
      name: 'auth',
      path: './core_modules',
      enabled: true
    },

  ];

  C.config.allModules = coreModules.concat(config.modules);

  //Loop over enabled modules in site config

  C.config.allModules.forEach(function (item) {

    if (item.enabled) {
      require(item.path + '/' + item.name + '/' + item.name);
    }

  });

};
