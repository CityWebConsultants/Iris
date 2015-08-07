var qs = require('qs');
var http = require('http');

C.testing = {};

C.testing.post = function (path, data) {

  return new Promise(function (yes, no) {

    Object.keys(data).forEach(function (element) {

      data[element] = JSON.stringify(data[element]);

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

      data[element] = JSON.stringify(data[element]);

    });

    data = qs.stringify(data);

    http.get("http://localhost:" + C.config.port + path + "?" + data, function (res) {
      var body = "";
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('end', function () {
        yes(body);
      });
    })

  });

}
