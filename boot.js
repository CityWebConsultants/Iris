"use strict";

/**
 * @file Boot-up process for Iris - prepares all modules, manages HTTP requests 
 * functions.
 */

module.exports = function (config) {

  //Create global object for the application, remove existing

  global.iris = {};

  // Set iris launch status

  iris.status = {

    ready: false

  };

  //Load in helper utilities

  require('./utils');

  var path = require('path');
  var fs = require('fs');

  // Restart function

  iris.restart = function (authPass, data = {}) {

    setTimeout(function () {

      iris.message(authPass.userid, "Server restarted", "success");

      iris.log("info", "Server restarted by " + authPass.userid);

      iris.invokeHook("hook_restart_send", authPass, null, data).then(function (data) {

        process.send({
          restart: data
        });

      });

    }, 500);

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

  //Load in module system

  require('./modules');

  // Create iris modules object

  iris.modules = {};

  //Core modules

  require('./modules/core/server/server.js');

  iris.modules.server.registerHook("hook_server_ready", 0, function (thisHook, data) {

    //Require sockets

    require('./modules/core/websockets/websockets.js');

    require('./modules/core/auth/auth.js');

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
    var toEnable = [];

    iris.enabledModules.forEach(function (enabledModule, index) {

      // Check if path in cache

      var lookup;

      try {
        fs.readFileSync(modulePathCache[enabledModule.name]);
        lookup = [modulePathCache[enabledModule.name]];
      } catch (e) {

        // Check if module path is a site path
        var rootParent = iris.rootPath.substring(0, iris.rootPath.length - 7);
        lookup = glob.sync("{" + rootParent + "/**/" + enabledModule.name + ".iris.module" + "," + iris.sitePath + "/modules/**/" + enabledModule.name + ".iris.module" + "}");

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

      if (!moduleInfo.weight) {

        moduleInfo.weight = 0;

      }

      toEnable.push({
        "info": moduleInfo,
        "path": modulePath,
        "name": enabledModule.name,
        "weight": moduleInfo.weight
      });

    });

    toEnable.sort(function (a, b) {

      if (a.weight > b.weight) {

        return 1;

      } else if (a.weight < b.weight) {

        return -1;

      } else {

        return 0;

      }

    });

    toEnable.forEach(function (currentModule) {

      var moduleInfo = currentModule.info,
        modulePath = currentModule.path,
        name = currentModule.name;

      if (moduleInfo.dependencies) {

        var unmet = [];

        Object.keys(moduleInfo.dependencies).forEach(function (dep) {

          if (!iris.modules[dep]) {

            unmet.push(dep);

          }

        });

        if (unmet.length) {

          iris.log("error", "Module " + name + " requires the following modules: " + JSON.stringify(unmet));
          return false;

        }

      }

      iris.registerModule(name, path.parse(modulePath).dir);

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

    //Set up database

    require('./modules/core/mongodb/mongodb.js');
    require('./modules/core/nedb/nedb.js');

    require('./db');

    process.on("dbReady", function () {

      iris.invokeHook("hook_system_ready", "root").then(function () {

        Object.freeze(iris);

      });

    });

    // Send server ready message and get sessions

    // There are 2 processes, a master process which allows for persistant sessions and user messages even if
    // the server is restarted via the admin form or there is a fatal error. The child process is the whole 
    // system including templates and hooks etc. Changing a module file for instance would require a restart 
    // to be used by the system. Restarting the child process flushes all files while the parent process
    // maintains sessions so that everyone isn't logged out.

    process.send("started");
    
  })

};
