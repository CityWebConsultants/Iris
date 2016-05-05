/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise*/

"use strict";

/**
 * @file Boot-up process for Iris - prepares all modules, manages HTTP requests 
 * functions.
 */

module.exports = function (config) {

  //Create global object for the application, remove existing

  global.iris = {};

  //Load in helper utilities

  require('./utils');

  var path = require('path');
  var fs = require('fs');

  // Restart function

  iris.restart = function (userid, where) {

    process.nextTick(function () {

      if (userid) {

        iris.message(userid, "Server restarted", "success");

      }

      iris.log("info", "Server restarted " + (userid ? " by user " + userid : "") + (where ? " via " + where : ""));

      process.send("restart");

    });

  };

  // Store helper paths

  iris.rootPath = __dirname;

  // Change iris folder name if name is specified in config

  var directory;

  var mkdirp = require('mkdirp');

  if (!config.sitePath) {

    config.sitePath = "/";

  }

  mkdirp.sync(process.cwd() + config.sitePath);

  iris.sitePath = process.cwd() + config.sitePath;

  // Detect/change Windows file paths

  if (path.sep === "\\") {

    iris.rootPath = iris.rootPath.split("\\").join("/");
    iris.sitePath = iris.sitePath.split("\\").join("/");

  }

  // Launch logging module

  require("./log");

  // Launch user messaging module

  require("./message");

  require("./config");

  //Make files directory

  iris.mkdirSync(iris.sitePath + "/" + "files");

  //Fetch command line parameters

  var parameters = {};

  process.argv.forEach(function (val, index, array) {

    if (val.indexOf("=") !== -1) {
      val = val.split("=");
      parameters[val[0]] = val[1];
    }

  });

  //Get any config parameters passed through via the command line and set them.

  if (Object.keys(parameters).length > 1) {

    console.log("Command line arguments: ");

    Object.keys(parameters).forEach(function (paramater) {

      if (paramater !== "site") {

        console.log(paramater, ":", parameters[paramater]);
        config[paramater] = parameters[paramater];

      }

    });

  }

  //Store config object for global use

  iris.config = config;

  console.log("\nStarting iris...");

  //Hook system

  iris.invokeHook = require('./hook');

  //Require HTTP sever

  require('./server');

  //Require sockets

  require('./sockets');

  //Load in module system

  require('./modules');

  //Set up database

  require('./db');

  iris.status = {

    ready: false

  };

  // Create iris modules object

  iris.modules = {};

  mongoose.connection.once("open", function () {

    //Core modules

    require('./modules/core/auth/auth.js');

    require('./modules/core/sessions/sessions.js');

    require('./modules/core/entity/entity.js');

    require('./modules/core/frontend/frontend.js');

    require('./modules/core/forms/forms.js');

    require('./modules/core/filefield/filefield.js');
    
    require('./modules/core/imagefield/imagefield.js');

    require('./modules/core/menu/menu.js');

    require('./modules/core/system/system.js');

    require('./modules/core/user/user.js');

    require('./modules/core/paths/paths.js');

    require('./modules/core/email/email.js');

    try {

      var file = fs.readFileSync(iris.configPath + '/system/enabled_modules.json', "utf8");

      iris.enabledModules = JSON.parse(file);

    } catch (e) {

      fs.writeFileSync(iris.configPath + '/system/enabled_modules.json', "[]");

      iris.enabledModules = [];

    }

    var path = require('path');

    var glob = require("glob");

    // Check if cache of module paths exists

    var modulePathCache;

    try {

      modulePathCache = JSON.parse(fs.readFileSync(iris.sitePath + "/local/modulePathCache.json", "utf8"));

    } catch (e) {

      modulePathCache = {};

    }

    // Cache object to save with found modules

    var foundModules = {};

    iris.enabledModules.forEach(function (enabledModule, index) {

      // Check if path in cache

      var lookup;

      try {
        fs.readFileSync(modulePathCache[enabledModule.name]);
        var lookup = [modulePathCache[enabledModule.name]];
      } catch (e) {

        // Check if module path is a site path
        var rootParent = iris.rootPath.substring(0, iris.rootPath.length - 7);
        var lookup = glob.sync("{" + rootParent + "/**/" + enabledModule.name + ".iris.module" + "," + iris.sitePath + "/modules/**/" + enabledModule.name + ".iris.module" + "}");

        lookup.reverse();

        if (!lookup.length) {

          iris.log("error", "error loading module " + enabledModule.name);
          return false;

        }
      }

      var moduleInfoPath = lookup[lookup.length - 1];

      var modulePath = lookup[lookup.length - 1].replace(".iris.module", ".js");
      var moduleInfo;

      // Add to cache

      foundModules[enabledModule.name] = moduleInfoPath;

      try {

        moduleInfo = JSON.parse(fs.readFileSync(moduleInfoPath));

      } catch (e) {

        // Read config file to check if dependencies satisfied

        console.error("error loading module " + enabledModule.name, e);
        return false;

      }

      if (moduleInfo.dependencies) {

        var unmet = [];

        Object.keys(moduleInfo.dependencies).forEach(function (dep) {

          if (!iris.modules[dep]) {

            unmet.push(dep);

          }

        });

        if (unmet.length) {

          iris.log("error", "Module " + enabledModule.name + " requires the following modules: " + JSON.stringify(unmet));
          return false;

        }

      }

      iris.registerModule(enabledModule.name, path.parse(modulePath).dir);

      try {

        require(modulePath);

      } catch (e) {

        // Check if module returning other error than file not found

        if (e.code !== "MODULE_NOT_FOUND") {

          iris.log("error", e);

        }

      }

    });

    iris.mkdirSync(iris.sitePath + "/" + "local");

    fs.writeFileSync(iris.sitePath + "/local/modulePathCache.json", JSON.stringify(foundModules));

    iris.status.ready = true;

    // Free iris object, no longer extensible

    Object.freeze(iris);

    console.log("Ready on port " + iris.config.port + ".");

    iris.log("info", "Server started");

    // Populate routes stored using iris.route

    iris.populateRoutes();

    /**
     * Catch all callback which is run last. If this is called then the GET request has not been defined 
     * anywhere in the system and will therefore return 404 error. 
     * This is also required for form submissions, POST requests are caught in hook_catch_request for example
     * where they are then forwarded to the required submit handler function.
     */

    iris.app.use(function (req, res) {

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

    });

    /**
     * Used for catching express.js errors such as errors in handlebars etc. It logs the error in the system
     * then returns a 500 error to the client.
     */

    iris.app.use(function (err, req, res, next) {

      if (err) {

        iris.log("error", "Error on line " + err.stack[0].getLineNumber() + " of " + err.stack[0].getFileName() + " " + err.message);

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

    });

    iris.dbPopulate();

    // Send server ready message and get sessions

    // There are 2 processes, a master process which allows for persistant sessions and user messages even if
    // the server is restarted via the admin form or there is a fatal error. The child process is the whole 
    // system including templates and hooks etc. Changing a module file for instance would require a restart 
    // to be used by the system. Restarting the child process flushes all files while the parent process
    // maintains sessions so that everyone isn't logged out.

    process.send("started");

  });

};
