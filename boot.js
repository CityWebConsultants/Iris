/*jslint nomen: true, node:true */
"use strict";

module.exports = function (config) {

  //Create global object for the application, remove existing

  global.C = {};

  var path = require('path');

  //Store helper paths

  C.rootPath = __dirname;
  C.sitePath = process.cwd();

  //Make config folder

  var fs = require('fs');

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(C.sitePath + "/" + "configurations");

  C.configStore = {};

  C.configPath = path.join(C.sitePath, "/configurations");

  C.saveConfig = function (contents, directory, filename, callback) {

    var current = C.configStore;

    directory.split("/").forEach(function (path) {

      if (!current[path]) {

        current[path] = {};

      }

      current = current[path];

    });

    current[filename] = contents;

    var filePath = path.join(C.sitePath, "/configurations", directory);

    var mkdirp = require('mkdirp');

    mkdirp(filePath, function (err) {
      if (err) {
        console.error(err)
      } else {
        fs.writeFile(filePath + "/" + filename + ".json", JSON.stringify(contents), "utf8", callback);
      }
    });

  };

  C.readConfig = function (directory, filename) {

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

      var exists = defined(C.configStore, directory + "/" + filename);

      if (exists) {

        yes(exists);

      } else {

        try {

          var contents = JSON.parse(fs.readFileSync(C.sitePath + "/configurations" + "/" + directory + "/" + filename + ".json", "utf8"));

          C.saveConfig(contents, directory, filename);

          yes(contents);

        } catch (e) {

          no("No such config exists");

        }

      }

    });

  };

  //Make files directory

  mkdirSync(C.sitePath + "/" + "files");

  //Fetch command line paramaters

  var paramaters = {};

  process.argv.forEach(function (val, index, array) {

    if (val.indexOf("=") !== -1) {
      val = val.split("=");
      paramaters[val[0]] = val[1];
    }

  });

  //Get any config paramaters passed through via the command line and set them.

  if (Object.keys(paramaters).length > 1) {

    console.log("Command line arguments: ");

    Object.keys(paramaters).forEach(function (paramater) {

      if (paramater !== "site") {

        console.log(paramater, ":", paramaters[paramater]);
        config[paramater] = paramaters[paramater];

      }

    })

  }

  //Store config object for global use

  C.config = config;

  console.log("\nLaunching server");

  //Hook system

  C.hook = require('./hook');

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

  C.status = {

    ready: false

  };

  mongoose.connection.once("open", function () {

    //Core modules

    require('./core_modules/auth/auth.js');

    C.hook("hook_module_init_auth", "root", null, null).then(function (success) {

      console.log("Auth module loaded")

    }, function (fail) {

      if (fail === "No such hook exists") {

        console.log("Auth module loaded")

      } else {

        console.log("Failed to initialise auth module", fail)

      }

    });

    require('./core_modules/entity/entity.js');

    C.hook("hook_module_init_entity", "root", null, null).then(function (success) {

      console.log("Auth module loaded")

    }, function (fail) {

      if (fail === "No such hook exists") {

        console.log("Entity module loaded")

      } else {

        console.log("Failed to initialise entity module", fail)

      }

    });

    //Load logging module

    require('./log');

    //Read enabled modules

    console.log("Loading modules.");

    C.enabledModules = JSON.parse(fs.readFileSync(process.cwd() + '/enabled_modules.json'));

    console.log(" ");

    C.enabledModules.forEach(function (enabledModule, index) {

      require(__dirname + enabledModule.path + "/" + enabledModule.name + ".js");

      C.hook("hook_module_init_" + enabledModule.name, "root", null, null).then(function (success) {

        console.log(enabledModule.name + " loaded")

      }, function (fail) {

        if (fail === "No such hook exists") {

          console.log(enabledModule.name + " loaded")

        } else {

          console.log(enabledModule.name + " failed to initialise", fail)

        }

      });

    });

    C.status.ready = true;

    //Free C object, no longer extensible

    Object.freeze(C);

    C.log.info("Server started");

    C.app.get("/restart", function (req, res) {

      res.redirect("/");

      process.send("restart");

    });

    C.app.use(function (req, res) {

      C.hook("hook_catch_request", req.authPass, {
        req: req
      }, null).then(function (success) {

        if (typeof success === "function") {

          success(res);

          if (!res.headersSent) {

            res.redirect(req.url);

          };

        } else {

          res.status(404).send('404');

        }

      }, function (fail) {

        res.status(404).send('404');

      })

    });

    C.app.use(function (err, req, res, next) {
      console.log(err);
      res.status(500).send('Something went wrong');
    });

    C.dbPopulate();

    // Send server ready message and get sessions

    process.send("started");

    process.on("message", function (m) {

      if (m.sessions) {

        Object.keys(m.sessions).forEach(function (user) {

          CM.auth.globals.userList[user] = m.sessions[user];

        });

      }

    });

  });

};
