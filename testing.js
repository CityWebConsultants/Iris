var qs = require('qs');
var http = require('http');

C.testing = {};

C.testing.post = function (path, data) {

  return new Promise(function (yes, no) {

    Object.keys(data).forEach(function (element) {

      try {

        data[element] = JSON.stringify(data[element]);

      } catch (e) {

        console.log("Not JSON stringified");

      }

    });

    data = qs.stringify(data);

    var options = {
      hostname: 'localhost',
      port: C.config.port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    var req = http.request(options, function (res) {

      var response = "";

      res.on('data', function (chunk) {
        response += chunk;
      });

      res.on('end', function () {
        yes(response);
      });

    });

    req.write(data);
    req.end();

  })

};

C.testing.get = function (path, data) {

  return new Promise(function (yes, no) {

    Object.keys(data).forEach(function (element) {

      try {

        data[element] = JSON.stringify(data[element]);

      } catch (e) {

        console.log("Not JSON stringified");

      }

    });

    data = qs.stringify(data);

    http.get("http://localhost:" + C.config.port + path + "?" + data, function (res) {
      console.log("Got response: " + res.statusCode);
    })

  });

}
