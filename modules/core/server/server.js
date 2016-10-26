var express = require('express');
iris.app = express();

iris.registerModule("server", __dirname);

/**
 * @file Express HTTP server setup and management functions.
 */

var bodyParser = require('body-parser'),
  i18n = require("i18n"),
  fs = require("fs");

// Redirect trailing slashes in urls (unless root url)

iris.app.use(function (req, res, next) {
  if (req.url.slice(-1) === '/' && req.url !== '/') {
    res.redirect(req.url.slice(0, -1));
  } else {

    next();

  }
});

//Set up bodyParser

if (!iris.config.bodyParserJSON) {

  iris.config.bodyParserJSON = {
    limit: "8mb"
  };

}

if (!iris.config.bodyParserURLencoded) {

  iris.config.bodyParserURLencoded = {
    extended: true,
    parameterLimit: 10000,
    limit: 10485760
  };

}

iris.app.use(bodyParser.json(iris.config.bodyParserJSON));

iris.app.use(bodyParser.urlencoded(iris.config.bodyParserURLencoded));

// I18n.
if (!fs.existsSync(iris.configPath + '/locales')) {
  fs.mkdirSync(iris.configPath + '/locales');
}
i18n.configure({
  defaultLocale: 'en',
  autoReload: true,
  directory: iris.configPath + '/locales',
  api: {
    '__': 't',
    '__n': 'tn'
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

var mainHandler = function (req, res, next) {

  if (!iris.status.ready) {

    setTimeout(function () {

      res.redirect(req.url);

    }, 500);


    return false;

  }

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

  // Check if auth is sent via session, query or post

  var auth = {};

  if (req.body.credentials) {

    auth.userid = req.body.credentials.userid;
    auth.token = req.body.credentials.token;

  }

  if (req.query.credentials) {

    auth.userid = req.query.credentials.userid;
    auth.token = req.query.credentials.token;

  }

  if (req.session.credentials) {

    auth.userid = req.session.credentials.userid;
    auth.token = req.session.credentials.token;

  }

  iris.modules.auth.globals.credentialsToPass(auth, req, res).then(function (authPass) {

    delete req.body.credentials;
    delete req.query.credentials;

    req.authPass = authPass;

    authPass.req = req;

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

      if (res.headerSent) {

        // Headers already sent by intercept hook

        return false;

      } else {

        next();

      }

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

};

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

    if (!iris.routes[route]) {

      iris.routes[route] = {};

    }

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

/**
 * Catch all callback which is run last. If this is called then the GET request has not been defined 
 * anywhere in the system and will therefore return 404 error. 
 * This is also required for form submissions, POST requests are caught in hook_catch_request for example
 * where they are then forwarded to the required submit handler function.
 */

var catchRequest = function (req, res) {

  if (!res.headersSent) {

    iris.invokeHook("hook_catch_request", req.authPass, {
      req: req,
      res: res
    }, null).then(function (success) {

        if (typeof success === "function") {

          var output = success(res, req);

          if (output && output.then) {

            output.then(function () {

              if (!res.headersSent) {

                res.redirect(req.url);

              }

            }, function (fail) {

              res.send(fail);

            });

          } else {

            if (!res.headersSent) {

              res.redirect(req.url);

            }

          }

        } else {

          iris.invokeHook("hook_display_error_page", req.authPass, {
            error: 404,
            req: req,
            res: res
          }).then(function (success) {

            if (!res.headersSent) {

              res.status(404).send(success);

            }


          }, function (fail) {

            if (!res.headersSent) {

              res.status(404).send("404");

            }

          });

        }

      },
      function (fail) {

        iris.log("error", "Error on request to " + req.url);
        iris.log("error", fail);

        iris.invokeHook("hook_display_error_page", req.authPass, {
          error: 500,
          req: req,
          res: res
        }).then(function (success) {

          res.status(500).send(success);

        }, function (fail) {

          res.status(500).send("500");

        });

      });

  }

};

/**
 * Used for catching express.js errors such as errors in handlebars etc. It logs the error in the system
 * then returns a 500 error to the client.
 */

var errorHandler = function (err, req, res, next) {

  if (err) {

    if (err.stack && err.stack[0] && err.stack[0].getLineNumber) {

      iris.log("error", "Error on line " + err.stack[0].getLineNumber() + " of " + err.stack[0].getFileName() + " " + err.message);

    } else {

      iris.log("error", err);

    }

    iris.invokeHook("hook_display_error_page", req.authPass, {
      error: 500,
      req: req,
      res: res
    }).then(function (success) {

      res.status(500).send(success);

    }, function (fail) {

      // Used if you don't have a 500 error template file.
      res.status(500).send('Something went wrong');

    });

  }

};

// Server listening

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

//Server and request function router once everything has done

iris.modules.server.registerHook("hook_system_ready", 0, function (thisHook, data) {

  // Sessions

  var session = require("express-session");

  if (!iris.config.expressSessionsConfig) {

    iris.config.expressSessionsConfig = {
      secret: iris.config.processID,
      resave: false,
      saveUninitialized: true
    };

  }

  iris.invokeHook("hook_session_store", "root", {
    session: session
  }, undefined).then(function (store) {

    // Default nedb store if none set

    if (typeof store === "undefined") {

      // Session store

      var NedbStore = require('nedb-session-store')(session);

      iris.config.expressSessionsConfig.store = new NedbStore({
        filename: iris.sitePath + "/temp/" + "sessions.db"
      });

    } else {

      iris.config.expressSessionsConfig.store = store;

    }

    iris.sessions = session(iris.config.expressSessionsConfig);

    iris.app.use(iris.sessions);

    iris.app.use(mainHandler);

    // Add static folders for modules

    Object.keys(iris.modules).forEach(function (currentModule) {

      iris.app.use('/modules/' + currentModule, express.static(iris.modules[currentModule].path + "/static"));

    });

    iris.populateRoutes();

    iris.app.use(catchRequest);
    iris.app.use(errorHandler);

    thisHook.pass(data);

  });

});
