var express = require('express'),
  bodyParser = require('body-parser');

C.app = express();

//Set up bodyParser

C.app.use(bodyParser.json());

C.app.use(bodyParser.urlencoded({
  extended: true
}));

C.app = express();

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

//Set up response sending

C.app.use(function (req, res, next) {

  res.respond = function (code, msg, notes) {

    var response = {};

    response.status = code;
    response.response = message;
    response.notes = notes;

    if (code.toString()[0] !== 2) {

      response.error = true;

    }

    res.send(response);

  }

  next();

});

//Set up CORS

C.app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

C.app.use(function (req, res, next) {

  if (Object.keys(req.query).length) {

    req.body = req.query;

  }

  Object.keys(req.body).forEach(function (element) {

    try {

      req.body[element] = JSON.parse(req.body[element]);

    } catch (e) {

      res.respond(401, "Data is not valid JSON", "Data is not valid JSON");

    }

  });
  CM.auth.globals.credentialsToPass(req.body.credentials).then(function (authPass) {

    req.authPass = authPass;
    next();

  }, function (error) {

    res.end(JSON.stringify(error));

  });

});

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
