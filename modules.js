CM = {};

var moduleTemplate = (function () {

  var hooks = {},
    path;

  return {

    set path(value) {

      if (!path) {

        path = value;

      } else {

        console.log("path already set");

      }

    },
    globals: {},
    get path() {

      return path;

    },
    registerHook: function (hookname, rank, callback) {

      if (typeof hookname === "string" && typeof rank === "number" && typeof callback === "function") {

        if (!hooks[hookname]) {

          hooks[hookname] = {

            rank: rank,
            event: callback

          }

        } else {

          console.log("Hook already defined in this module");

        }

      } else {

        console.log("Not a valid hook");
        return false;

      }

    },
    get hooks() {
      return hooks;
    },

  }

})

C.registerModule = function (name) {

  if (CM[name]) {

    console.log("Module already exists");

  } else {

    CM[name] = new moduleTemplate;
    CM[name].path = C.getModulePath(name);
    Object.seal(CM[name]);

  }

  return CM[name];

};

C.getModulePath = function (name) {

  var path = require('path');

  var found = "";

  C.config.allModules.forEach(function (enabledModule) {

    if (enabledModule.enabled && enabledModule.name === name) {

      found = path.parse(enabledModule.path + '/' + enabledModule.name + '/' + enabledModule.name);

    }

  });

  return found;

};

C.include = function (defaultLocation, customLocation) {

  var customLocation = customLocation;

  //  Check file exists

  try {
    return require(customLocation);
  } catch (e) {
    return require(defaultLocation);
  }

};
