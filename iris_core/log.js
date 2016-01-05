/**
 * @file Implements the iris logging system.
 */

var initLogger = function (daycount) {

  // Default to 10 days logging
  
  if (!daycount) {

    var daycount = 10

  }

  var fs = require('fs');
  var bunyan = require('bunyan');

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(iris.sitePath + "/" + "logs");

  var bunyanSettings = {
    name: 'iris',
    streams: [{
      type: 'rotating-file',
      path: iris.sitePath + '/logs/' + "main.log",
      period: '1d', // daily rotation
      count: daycount // keep 3 back copies
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

  iris.log = function () {

    var logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

    var type = arguments[0];

    // Check if type is valid

    if (logLevels.indexOf(type) === -1) {

      iris.log("error", "invalid log type" + type + " changed to info");

      type = "info";

    }

    var message = arguments[1];

    logger[type](message);

    process.send({
      type: "log",
      data: {
        type: arguments[0],
        message: arguments[1]
      }
    })

    if (iris.hook) {

      iris.hook("hook_log", "root", {
        type: type,
        message: message
      })

    }

  }

}

module.exports = initLogger;
