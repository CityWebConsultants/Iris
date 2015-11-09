C.log = function () {

  var type = arguments[0];
//  var messages = Array.prototype.slice.call(arguments, 1);
  var message = arguments[1];

  C.hook("hook_log", "root", {type: type, message: message}).then(function (success) {



  }, function (fail) {

    // Fallback error log
    console.log(type.toUpperCase() + ': ' + message);

  });

}
