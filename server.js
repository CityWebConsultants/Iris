var express = require('express'),
  bodyParser = require('body-parser');

C.app = express();

//Set up bodyParser

C.app.use(bodyParser.json());

C.app.use(bodyParser.urlencoded({
  extended: true
}));

var cookieParser = require('cookie-parser')
C.app.use(cookieParser());

//Set up bodyParser

C.app.use(bodyParser.json());

C.app.use(bodyParser.urlencoded({
  extended: true
}));

//Error helper function

C.error = function (code, message, notes) {

  return {
    code: code,
    message: message,
    notes: notes
  }

};

//Set up CORS

var fs = require("fs");

C.app.use(function (req, res, next) {

  if (!C.status.ready) {

    fs.readFile(C.sitePath + "/" + C.config.theme + "/templates/startup.html", "utf8", function (err, file) {

      if (!err) {

        res.send(file);

      } else {

        fs.readFile(C.rootPath + "/core_modules/frontend/templates/startup.html", "utf8", function (err, file) {

          if (!err) {

            res.send(file);

          } else {

            res.send("Starting up");

          }

        })

      }

    });

    return false;

  }

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Set up response sending

C.app.use(function (req, res, next) {

  res.respond = function (code, msg, notes) {

    var response = {};

    response.status = code;
    response.response = msg;

    if (notes) {
      response.notes = notes;
    }

    if (code.toString()[0] !== "2") {

      response.error = true;

    }

    res.status(code);

    res.end(JSON.stringify(response));

  }

  next();

});


C.app.use(function (req, res, next) {

  if (Object.keys(req.query).length) {

    req.body = Object.assign(req.query, req.body);

  }

  Object.keys(req.body).forEach(function (element) {

    try {

      req.body[element] = JSON.parse(req.body[element]);

    } catch (e) {

      // Allowing non-JSON encoded data

    }

  });
  CM.auth.globals.credentialsToPass(req.body.credentials, req).then(function (authPass) {

    delete req.body.credentials;

    req.authPass = authPass;
    next();

  }, function (error) {

    res.end(JSON.stringify(error));

  });

});

//Public files folder

C.app.use("/files", express.static(C.sitePath + '/files'));

//Server and request function router

if (C.config.https) {

  var https = require('https');

  var tls_options = {
    key: fs.readFileSync(C.config.https_key),
    cert: fs.readFileSync(C.config.https_cert)
  };

  C.server = https.createServer(tls_options, C.app);

  C.server.listen(C.config.port);

} else {

  var http = require('http');

  C.server = http.createServer(C.app);

  C.server.listen(C.config.port);

}
