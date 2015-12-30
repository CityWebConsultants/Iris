/**
 * @file Implements the base logging system.
 */

/**
 * Logs an event.
 *
 * Essentially a wrapper for hook_log, but includes a fallback to the console.
 *
 * @params {string} type - Type of event, from 'trace', debug', 'info', 'warn', 'error', 'fatal'.
 * @params {string} message - Log message
 */
iris.log = function () {

  var type = arguments[0];
//  var messages = Array.prototype.slice.call(arguments, 1);
  var message = arguments[1];

  iris.hook("hook_log", "root", {type: type, message: message}).then(function (success) {



  }, function (fail) {

    // Fallback error log
    console.log(type.toUpperCase() + ': ' + message);

  });

}
