var fs = require('fs');

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code != 'EEXIST') throw e;
  }
}

mkdirSync(C.sitePath + "/" + "logs");

var bunyan = require('bunyan');

C.log = bunyan.createLogger({
  name: 'C',
  streams: [{
    path: C.sitePath + "/" + "logs/main.log",
          }]
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
