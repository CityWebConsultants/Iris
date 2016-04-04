/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

/**
 * @file Implements the iris logging system.
 */

var initLogger = function () {

  var fs = require('fs');
  var bunyan = require('bunyan');

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  };

  mkdirSync(iris.sitePath + "/" + "logs");

  var bunyanSettings = {
    name: 'iris',
    streams: [{
      path: iris.sitePath + '/logs/' + "main.log",
  }]
  };

  var logger = bunyan.createLogger(bunyanSettings);

  /**
   * Logs an event.
   *
   * Call server message logging function and hook log.
   *
   * @params {string} type - Type of event, from 'trace', debug', 'info', 'warn', 'error', 'fatal'.
   * @params {string} message - Log message
   */

  var _getCallerFile = function () {
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
  };

  iris.log = function () {
    
    var args = [].slice.call(arguments, 0);
    
    if (args && !args[1]) {

      args[1] = "Empty log called from " + _getCallerFile();

    }

    // If an exception gets passed in, process it into log messages

    if (args && args[1] && Array.isArray(args[1].stack)) {

      var e = args[1];

      // If no error message send the file that called the log

      var errorMessage = '';

      e.stack.forEach(function (error, index) {

        errorMessage += "Error on line " + e.stack[index].getLineNumber() + " of " + e.stack[index].getFileName() + " " + e.message + '\n';

      });

      errorMessage += "Log called from " + _getCallerFile();

      iris.log("fatal", errorMessage);

      // Log was called for each part of the stack; there is nothing left to log on this call

      return false;

    }

    var logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

    var type = args[0];

    // Check if type is valid

    if (logLevels.indexOf(type) === -1) {

      iris.log("error", "invalid log type" + type + " changed to info");

      type = "info";

    }

    var message = args[1];

    logger[type](message);

    process.send({
      type: "log",
      data: {
        type: args[0],
        message: args[1]
      }
    });

    if (iris.invokeHook) {

      iris.invokeHook("hook_log", "root", {
        type: type,
        message: message
      });

    }

  };

}();

module.exports = initLogger;
