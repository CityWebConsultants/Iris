/*jslint nomen: true, node:true */
"use strict";

/**
 * @file Boot-up process for Iris - prepares all modules, manages HTTP requests, provides config storage 
 * functions.
 */


module.exports = function (config) {

  //Create global object for the application, remove existing

  global.iris = {};

  var path = require('path');

  // Restart function

  iris.restart = function (userid, where) {

    if (userid) {

      iris.message(userid, "Server restarted successfully", "success");

    }

    iris.log("info", "Server restarted " + (userid ? " by user " + userid : "") + (where ? " via " + where : ""));

    process.send("restart");

  };

  // Store helper paths

  iris.rootPath = path.resolve(__dirname + "/../");

  iris.sitePath = process.cwd();

  // Detect/change Windows file paths

  if (path.sep === "\\") {

    iris.rootPath = iris.rootPath.split("\\").join("/");
    iris.sitePath = iris.sitePath.split("\\").join("/");

  }

  // Launch logging module

  require("./log")(config.logdays);

  // Launch user messaging module

  require("./message");

  //Make config folder

  var fs = require('fs');

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }
    }
  };

  mkdirSync(iris.sitePath + "/" + "configurations");

  iris.configStore = {};

  iris.configPath = path.join(iris.sitePath, "/configurations");

  /**
   * Saves a JavaScript object as a JSON configuration file.
   *
   * Additionally, adds the config to the configStore in memory.
   *
   * @param {object} contents - The object (of key-value pairs) to be saved
   * @param {string} directory - The directory, under "<site path>/configurations", in which to store the file
   * @param {string} filename - The name of the file
   * @param {function} callback - The callback to run once the file has been saved
   *
   * @returns Runs callback with 'err' boolean (false if operation successful)
   */
  iris.saveConfig = function (contents, directory, filename, callback, writeToFile) {

    var current = iris.configStore;

    directory.split("/").forEach(function (path) {

      if (!current[path]) {

        current[path] = {};

      }

      current = current[path];

    });

    current[filename] = contents;

    if (writeToFile !== false) {

      var filePath = path.join(iris.sitePath, "/configurations", directory);

      var mkdirp = require('mkdirp');

      mkdirp(filePath, function (err) {
        if (err) {
          console.error(err);
        } else {
          fs.writeFile(filePath + "/" + filename + ".json", JSON.stringify(contents), "utf8", callback);
        }
      });
    }

    // Fire config saved hook

    iris.hook("hook_config_saved", "root", {
      contents: contents,
      directory: directory,
      filename: filename
    });

  };

  /**
   * Deletes a saved JSON config file
   *
   * Additionally, the saved configStore for the file will be deleted
   *
   * @param {string} directory - The directory, under "<site path>/configurations", in which the file is stored
   * @param {string} filename - The name of the file
   * @param {string} callback - The callback to run once completed
   *
   * @returns Runs callback with 'err' boolean (false if operation successful)
   */
  iris.deleteConfig = function (directory, filename, callback) {

    var splitDirectory = directory.split('/');

    if (splitDirectory.length > 1) {

      // Get last parts of the directory, used as key in config store
      var configStoreCategory = splitDirectory[splitDirectory.length - 2];
      var configStoreInstance = splitDirectory[splitDirectory.length - 1];

      delete iris.configStore[configStoreCategory][configStoreInstance][filename];

    } else {

      delete iris.configStore[directory][filename];

    }

    var filePath = path.join(iris.sitePath, "/configurations", directory);

    filePath = filePath + '/' + filename + '.json';

    fs.unlink(filePath, function (err) {

      if (err) {

        // Return err = true
        callback(true);

      } else {

        callback(false);

      }

    });

  };

  /**
   * Reads a stored JSON configuration file
   *
   * Will attempt to read from the configStore cache.
   *
   * @param {string} directory - The directory, under "<site path>/configurations", in which the file is stored
   * @param {string} filename - The name of the file
   *
   * @returns A promise which, if successful, has the config file as a JavaScript object as its first argument
   */
  iris.readConfig = function (directory, filename) {

    return new Promise(function (yes, no) {

      function defined(ref, strNames) {
        var name;
        var arrNames = strNames.split('/');

        while (name = arrNames.shift()) {
          if (!ref.hasOwnProperty(name)) {
            return false;
          }
          ref = ref[name];
        }

        return ref;
      }

      var exists = defined(iris.configStore, directory + "/" + filename);

      if (exists) {

        yes(exists);

      } else {

        try {

          var contents = JSON.parse(fs.readFileSync(iris.sitePath + "/configurations" + "/" + directory + "/" + filename + ".json", "utf8"));

          iris.saveConfig(contents, directory, filename, null, false);

          yes(contents);

        } catch (e) {

          no(e);

        }

      }

    });

  };

  //Make files directory

  mkdirSync(iris.sitePath + "/" + "files");

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

  iris.hook = require('./hook');

  //Load in helper utilities

  require('./utils');

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

    require('./modules/core/menu/menu.js');

    require('./modules/core/admin_ui/admin_ui.js');

    require('./modules/core/user/user.js');

    require('./modules/core/paths/paths.js');

    require('./modules/core/textfilters/textfilters.js');

    try {

      var file = fs.readFileSync(process.cwd() + '/enabled_modules.json');

      iris.enabledModules = JSON.parse(file);

    } catch (e) {

      fs.writeFileSync(process.cwd() + '/enabled_modules.json', "[]");

      iris.enabledModules = [];

    }

    var path = require('path');

    var glob = require("glob");

    iris.enabledModules.forEach(function (enabledModule, index) {

      // Check if module path is a site path

      var lookup = glob.sync("{" + iris.rootPath + "/iris_core/modules/extra/**/" + enabledModule.name + ".iris.module" + "," + iris.sitePath + "/modules/**/" + enabledModule.name + ".iris.module" + "," + iris.rootPath + "/home/modules/**/" + enabledModule.name + ".iris.module" + "}");

      lookup.reverse();

      if (!lookup.length) {

        iris.log("error", "error loading module " + enabledModule.name);
        return false;

      }

      var moduleInfoPath = lookup[lookup.length - 1];

      var modulePath = lookup[lookup.length - 1].replace(".iris.module", ".js");

      try {

        var moduleInfo = JSON.parse(fs.readFileSync(moduleInfoPath));

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

        };

      }

    });

    iris.status.ready = true;

    // Free iris object, no longer extensible

    Object.freeze(iris);

    console.log("Ready on port " + iris.config.port + ".");

    iris.log("info", "Server started");

    /**
     * Catch all callback which is run last. If this is called then the GET request has not been defined 
     * anywhere in the system and will therefore return 404 error. 
     * This is also required for form submissions, POST requests are caught in hook_catch_request for example
     * where they are then forwarded to the required submit handler function.
     */

    iris.app.use(function (req, res) {

      iris.hook("hook_catch_request", req.authPass, {
        req: req
      }, null).then(function (success) {

          if (typeof success === "function") {

            var output = success(res);

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

            iris.hook("hook_display_error_page", req.authPass, {
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

          iris.hook("hook_display_error_page", req.authPass, {
            error: 404,
            req: req,
            res: res
          }).then(function (success) {

            res.status(404).send(success);

          }, function (fail) {

            res.status(404).send("404");

          });

        });

    });

    /**
     * Used for catching express.js errors such as errors in handlebars etc. It logs the error in the system
     * then returns a 500 error to the client.
     */

    iris.app.use(function (err, req, res, next) {

      if (err) {

        iris.log("error", "Error on line " + err.stack[0].getLineNumber() + " of " + err.stack[0].getFileName() + " " + err.message);

        iris.hook("hook_display_error_page", req.authPass, {
          error: 500,
          req: req,
          res: res
        }).then(function (success) {

          res.status(500).send(success);

        }, function (fail) {

          // Used if you don't have a 500 error template file.
          res.status(500).send('Something went wrong');;

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

    process.on("message", function (m) {

      if (m.sessions) {

        Object.keys(m.sessions).forEach(function (user) {

          iris.modules.auth.globals.userList[user] = m.sessions[user];

        });

      }

      if (m.messages) {

        Object.keys(m.messages).forEach(function (user) {

          iris.messageStore[user] = m.messages[user];

        });

      }

    });

  });

};
