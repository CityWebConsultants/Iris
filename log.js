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
