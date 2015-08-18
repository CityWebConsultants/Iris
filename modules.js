CM = {};

var moduleTemplate = (function () {

  var hooks = {},
    socketListeners = {},
    path,
    configPath;

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
    registerSocketListener: function (name, callback) {

      if (!socketListeners[name]) {

        socketListeners[name] = callback;

        if (!C.socketListeners[name]) {

          C.socketListeners[name] = [];

        }

        C.socketListeners[name].push(callback);

      } else {

        console.log("This socket listener has already been defined in this module");

      }

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
    get socketListeners() {
      return socketListeners;
    },

  }

})

C.registerModule = function (name) {

  if (CM[name]) {

    console.log("Module already exists");
    return false;

  } else {

    CM[name] = new moduleTemplate;
//    CM[name].path = C.getModulePath(name);

    //Create config directory

    var fs = require('fs');

    var mkdirSync = function (path) {
      try {
        fs.mkdirSync(path);
      } catch (e) {
        if (e.code != 'EEXIST') throw e;
      }
    }

    mkdirSync(C.configPath + "/" + name);

    CM[name].configPath = C.configPath + "/" + name;

    Object.seal(CM[name]);

  }

  return CM[name];

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
