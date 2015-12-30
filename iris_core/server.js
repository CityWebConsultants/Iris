/**
 * @file Express HTTP server setup and management functions.
 */
var express = require('express'),
  bodyParser = require('body-parser');

iris.app = express();

//Set up bodyParser

iris.app.use(bodyParser.json());

iris.app.use(bodyParser.urlencoded({
  extended: true
}));

var cookieParser = require('cookie-parser')
iris.app.use(cookieParser());

//Set up bodyParser

iris.app.use(bodyParser.json());

iris.app.use(bodyParser.urlencoded({
  extended: true
}));

/**
 * Error helper function
 *
 * Converts parameters code, message and notes into a keyed object.
 */
iris.error = function (code, message, notes) {

  return {
    code: code,
    message: message,
    notes: notes
  }

};

//Set up CORS

var fs = require("fs");

iris.app.use(function (req, res, next) {

  if (!iris.status.ready) {

    fs.readFile(iris.sitePath + "/" + iris.config.theme + "/templates/startup.html", "utf8", function (err, file) {

      if (!err) {

        res.send(file);

      } else {

        fs.readFile(iris.rootPath + "/core_modules/frontend/templates/startup.html", "utf8", function (err, file) {

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

iris.app.use(function (req, res, next) {

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


iris.app.use(function (req, res, next) {

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

  iris.modules.auth.globals.credentialsToPass(req.body.credentials, req).then(function (authPass) {

    delete req.body.credentials;

    req.authPass = authPass;

    // Run request intercept in case anything

    iris.hook("hook_request_intercept", req.authPass, {
      req: req
    }).then(function () {

      next();

    }, function (error) {

      if (error === "No such hook exists") {

        next();

      } else {

        res.status(400);
        res.send(error);

      }

    });

  }, function (error) {

    res.end(JSON.stringify(error));

  });

});

//Public files folder

iris.app.use("/files", express.static(iris.sitePath + '/files'));

//Server and request function router

if (iris.config.https) {

  var https = require('https');

  var tls_options = {
    key: fs.readFileSync(iris.config.https_key),
    cert: fs.readFileSync(iris.config.https_cert)
  };

  iris.server = https.createServer(tls_options, iris.app);

  iris.server.listen(iris.config.port);

} else {

  var http = require('http');

  iris.server = http.createServer(iris.app);

  iris.server.listen(iris.config.port);

}
