C.registerModule("bunyan");

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

mkdirSync(C.sitePath + "/" + "logs");

var bunyan = require('bunyan');

var bunyanSettings = {
  name: 'C',
  streams: []
};

if (C.config.logging_to_file_level && C.config.logging_output_file) {
  bunyanSettings.streams.push({level: C.config.logging_to_file_level, path: C.sitePath + '/' + C.config.logging_output_file});
}

CM.bunyan.globals.logger = bunyan.createLogger(bunyanSettings);

CM.bunyan.registerHook("hook_log", 0, function (thisHook, data) {

  CM.bunyan.globals.logger[thisHook.const.type](thisHook.const.message);

  if (C.config.logging_console_level && logLevels[thisHook.const.type] >= logLevels[C.config.logging_console_level]) {

    var time = new Date();
    var timeString = ("0" + time.getHours()).slice(-2)   + ":" + ("0" + time.getMinutes()).slice(-2) + ":" + ("0" + time.getSeconds()).slice(-2);

    console.log(timeString + ' [' + thisHook.const.type.toUpperCase() + '] ' + thisHook.const.message);

  }

});

CM.auth.globals.registerPermission("can read logs", "logs");

C.app.get("/api/logs", function (req, res) {

  if (CM.auth.globals.checkPermissions(["can read logs"], req.authPass)) {

    try {

      var rawLogs = fs.readFileSync(C.sitePath + "/" + "logs/main.log", "utf8");

      //Remove last line

      rawLogs = rawLogs.replace(/\n$/, "");

      //Split logs by newline

      var logs = rawLogs.split(/\r?\n/)

      logs.forEach(function (element, index) {

        logs[index] = JSON.parse(logs[index]);

      });

      res.respond(200, logs);

    } catch (e) {

      res.send("no logs");

    }

  } else {

    res.respond(403, "Access denied");

  };

});
