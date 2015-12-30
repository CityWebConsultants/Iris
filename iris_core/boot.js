/*jslint nomen: true, node:true */
"use strict";

module.exports = function (config) {

  //Create global object for the application, remove existing

  global.iris = {};

  var path = require('path');

  //Store helper paths

  iris.rootPath = __dirname;
  iris.sitePath = process.cwd();

  //Make config folder

  var fs = require('fs');

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

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
  iris.saveConfig = function (contents, directory, filename, callback) {

    var current = iris.configStore;

    directory.split("/").forEach(function (path) {

      if (!current[path]) {

        current[path] = {};

      }

      current = current[path];

    });

    current[filename] = contents;

    var filePath = path.join(iris.sitePath, "/configurations", directory);

    var mkdirp = require('mkdirp');

    mkdirp(filePath, function (err) {
      if (err) {
        console.error(err)
      } else {
        fs.writeFile(filePath + "/" + filename + ".json", JSON.stringify(contents), "utf8", callback);
      }
    });

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
          if (!ref.hasOwnProperty(name)) return false;
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

          iris.saveConfig(contents, directory, filename);

          yes(contents);

        } catch (e) {

          no("No such config exists");

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

    })

  }

  //Store config object for global use

  iris.config = config;

  console.log("\nLaunching server");

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

    require('./modules/core/entity/entity.js');

    require('./modules/core/frontend/frontend.js');

    require('./modules/core/forms/forms.js');

    require('./modules/core/entity2/entity2.js');

    require('./modules/core/filefield/filefield.js');

    require('./modules/core/menu/menu.js');

    require('./modules/core/admin_ui/admin_ui.js');

    require('./modules/core/user/user.js');

    require('./modules/core/paths/paths.js');

    //Load logging module

    require('./log');

    //Read enabled modules

    console.log("Loading modules.");

    iris.enabledModules = JSON.parse(fs.readFileSync(process.cwd() + '/enabled_modules.json'));

    console.log(" ");

    var path = require('path');

    iris.enabledModules.forEach(function (enabledModule, index) {

      var modulePath = path.resolve(__dirname + "/../" + enabledModule.path + "/" + enabledModule.name + ".js");

      try {

        fs.readFileSync(modulePath);

      } catch (e) {

        console.log("can't find module " + enabledModule.name)
        return false;

      }

      require(modulePath);

      iris.hook("hook_module_init_" + enabledModule.name, "root", null, null).then(function (success) {

        console.log(enabledModule.name + " loaded")

      }, function (fail) {

        if (fail === "No such hook exists") {

          console.log(enabledModule.name + " loaded")

        } else {

          console.log(enabledModule.name + " failed to initialise", fail)

        }

      });

    });

    iris.status.ready = true;

    // Free C object, no longer extensible

    Object.freeze(iris);

    iris.log("info", "Server started");

    iris.app.use(function (req, res) {

      iris.hook("hook_catch_request", req.authPass, {
        req: req
      }, null).then(function (success) {

          if (typeof success === "function") {

            success(res).then(function () {

              if (!res.headersSent) {

                res.redirect(req.url);

              };

            }, function (fail) {

              res.send(fail);

            })

          } else {

            iris.hook("hook_display_error_page", req.authPass, {
              error: 404,
              req: req,
              res: res
            }).then(function (success) {

              res.status(404).send(success);

            }, function (fail) {

              res.status(404).send("404");

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

          res.status(500).send('Something went wrong');;

        });

      }

    });

    iris.dbPopulate();

    // Send server ready message and get sessions

    process.send("started");

    process.on("message", function (m) {

      if (m.sessions) {

        Object.keys(m.sessions).forEach(function (user) {

          iris.modules.auth.globals.userList[user] = m.sessions[user];

        });

      }

    });

  });

};
