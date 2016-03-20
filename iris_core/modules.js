/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

/**
 * @file Base for the module system. Provides functions for module registration and management.
 */

iris.modules = {};

var moduleTemplate = (function () {

  var hooks = {},
    socketListeners = {},
    path;

  return {

    set path(value) {

      if (!path) {

        path = value;

      } else {

        console.log("path already set");

      }

    },
    globals: {},
    get path() {

      return path;

    },
    registerSocketListener: function (name, callback) {

      if (!socketListeners[name]) {

        socketListeners[name] = callback;

        if (!iris.socketListeners[name]) {

          iris.socketListeners[name] = [];

        }

        iris.socketListeners[name].push(callback);

      } else {

        console.log("This socket listener has already been defined in this module");

      }

    },
    registerHook: function (hookname, rank, callback) {

      if (typeof hookname === "string" && typeof rank === "number" && typeof callback === "function") {

        if (!hooks[hookname]) {

          hooks[hookname] = {

            rank: rank,
            event: callback

          };

        } else {

          console.log("Hook " + hookname + " already defined in this module");

        }

      } else {

        console.log("Not a valid hook");
        return false;

      }

    },
    get hooks() {
      return hooks;
    },
    get socketListeners() {
      return socketListeners;
    },

  };

});

function _getCallerFile() {
  try {
    var err = new Error();
    var callerfile;
    var currentfile;

    Error.prepareStackTrace = function (err, stack) {
      return stack;
    };

    currentfile = err.stack.shift().getFileName();

    while (err.stack.length) {
      callerfile = err.stack.shift().getFileName();

      if (currentfile !== callerfile) return callerfile;
    }
  } catch (err) {}
  return undefined;
}

var path = require('path');
var express = require('express');

/**
 * Register a module to make its hooks and handlers active.
 *
 * @param {string} name - The name of the module; this should match the filename
 * @param {boolean} [directory] - Flag for whether a config directory should be created for this module.
 *
 * @returns the internal module object that was created, if succesful.
 */
iris.registerModule = function (name, modulePath) {

  if (iris.modules[name]) {

    console.log("Module already exists");
    return false;

  } else {

    iris.modules[name] = new moduleTemplate();
    iris.modules[name].path = modulePath ? modulePath : path.parse(_getCallerFile()).dir;

    iris.app.use('/modules/' + name, express.static(iris.modules[name].path + "/static"));

    Object.seal(iris.modules[name]);

  }

  return iris.modules[name];

};

/**
 * Attempt to load a file from a given location or fall back to a default location.
 *
 * @param {string} defaultLocation - Fallback location of file
 * @param {string} customLocation - Preferred custom location of file
 *
 * @returns the file as a module, as the output of require()
 */
iris.include = function (defaultLocation, customLocation) {

  customLocation = customLocation;

  //  Check file exists

  try {
    return require(customLocation);
  } catch (e) {
    return require(defaultLocation);
  }

};
