/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

/**
 * @file Express HTTP server setup and management functions.
 */
var express = require('express'),
  bodyParser = require('body-parser'),
  i18n = require("i18n"),
  fs = require("fs");

iris.app = express();

//Set up bodyParser

iris.app.use(bodyParser.json());

iris.app.use(bodyParser.urlencoded({
  extended: true,
  parameterLimit: 10000,
  limit: 10485760
}));

// I18n.
if (!fs.existsSync(iris.configPath + '/locales')){
  fs.mkdirSync(iris.configPath + '/locales');
}
i18n.configure({
  defaultLocale: 'en',
  autoReload: true,
  directory: iris.configPath + '/locales',
  api: {
    '__' : 't',
    '__n' : 'tn'
  }
});

iris.i18n = i18n;

var cookieParser = require('cookie-parser');
iris.app.use(cookieParser());

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
  };

};

//Set up CORS

var fs = require("fs");

iris.app.use(function (req, res, next) {

  if (!iris.status.ready) {

    setTimeout(function () {

      res.redirect(req.url);

    }, 500);


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

    res.header('Content-Type', 'application/json');

    res.status(code);

    res.end(JSON.stringify(response));

  };

  next();

});


iris.app.use(function (req, res, next) {

  try {

    if (Object.keys(req.body).length === 1) {

      if (req.body[Object.keys(req.body)[0]].length === 0) {

        req.body = JSON.parse(Object.keys(req.body)[0]);

      }

    }

  } catch (e) {

    // Must be URL encoded

  }

  Object.keys(req.body).forEach(function (element) {

    try {

      req.body[element] = JSON.parse(req.body[element]);

    } catch (e) {

      // Allowing non-JSON encoded data

    }

  });

  if (req.query) {

    Object.keys(req.query).forEach(function (element) {

      try {

        req.query[element] = JSON.parse(req.query[element]);

      } catch (e) {

        // Allowing non-JSON encoded data

      }

    });

  }

  iris.modules.auth.globals.credentialsToPass(req.body.credentials || req.query.credentials, req, res).then(function (authPass) {

    delete req.body.credentials;

    req.authPass = authPass;

    // Check if it matches any routes stored with iris_route.

    var pathToRegexp = require('path-to-regexp');

    Object.keys(iris.routes).forEach(function (route) {

      var url = require("url");

      var regexRoute = pathToRegexp(route);

      if (url.parse(req.url).pathname.match(regexRoute)) {

        // Route matches


        if (iris.routes[route][req.method.toLowerCase()]) {

          req.irisRoute = {
            path: route,
            options: iris.routes[route][req.method.toLowerCase()].options
          };

        }

      }

    });

    // Run request intercept in case anything

    iris.invokeHook("hook_request_intercept", req.authPass, {
      req: req,
      res: res
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

    res.status(400).send(JSON.stringify(error));

  });

});

// Menu registering function

var methods = ["get", "post", "put", "head", "delete", "options", "trace", "copy", "lock", "mkcol", "move", "purge", "propfind", "proppatch", "unlock", "report", "mkactivity", "checkout", "merge", "m-search", "notify", "subscribe", "unsubscribe", "patch", "search", "connect"];

iris.route = {};
iris.routes = {};

methods.forEach(function (method) {

  // takes route, (optional options), callback, optional rank

  iris.route[method] = function () {

    var route = arguments[0];
    var options = {};
    var callback;
    var rank;

    if (typeof arguments[1] === "object") {

      options = arguments[1];
      callback = arguments[2];
      rank = arguments[3];

    } else {

      callback = arguments[1];
      rank = arguments[2];

    }

    // Don't store if rank is lower than an existing route for this path.

    if (iris.routes[route] && iris.routes[route].rank > rank) {

      return false;

    }

    iris.routes[route] = {};

    iris.routes[route][method] = {

      options: options,
      callback: callback

    };

    if (rank) {

      iris.routes[route][method].rank = rank;

    }

  };

});

// Convert stored routes into express handlers

iris.populateRoutes = function () {

  Object.keys(iris.routes).forEach(function (route) {

    // Loop over methods for each route

    Object.keys(iris.routes[route]).forEach(function (method) {

      var methodInstance = iris.routes[route][method];

      iris.app[method](route, methodInstance.callback);

    });

  });

};

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
