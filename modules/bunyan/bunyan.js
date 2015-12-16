iris.registerModule("bunyan");

var fs = require('fs');

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code != 'EEXIST') throw e;
  }
}

var logLevels = {
  'trace': 10,
  'debug': 20,
  'info': 30,
  'warn': 40,
  'error': 50,
  'fatal': 60
}

mkdirSync(iris.sitePath + "/" + "logs");

var bunyan = require('bunyan');

var bunyanSettings = {
  name: 'C',
  streams: []
};

try {

  fs.readFileSync(iris.sitePath + '/logs/' + "main.log", "utf8");

} catch (e) {

  fs.writeFileSync(iris.sitePath + '/logs/' + "main.log", "");

}

bunyanSettings.streams.push({
  path: iris.sitePath + '/logs/' + "main.log"
});

iris.modules.bunyan.globals.logger = bunyan.createLogger(bunyanSettings);

iris.modules.bunyan.registerHook("hook_log", 0, function (thisHook, data) {

  iris.modules.bunyan.globals.logger[thisHook.const.type](thisHook.const.message);

    var time = new Date();
    var timeString = ("0" + time.getHours()).slice(-2) + ":" + ("0" + time.getMinutes()).slice(-2) + ":" + ("0" + time.getSeconds()).slice(-2);

    console.log(timeString + ' [' + thisHook.const.type.toUpperCase() + '] ' + thisHook.const.message);

});
