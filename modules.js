C.m = {};

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

var getCallerFile = function() {
    var originalFunc = Error.prepareStackTrace;

    var callerfile;
    try {
        var err = new Error();
        var currentfile;

        Error.prepareStackTrace = function (err, stack) { return stack; };

        currentfile = err.stack.shift().getFileName();

        while (err.stack.length) {
            callerfile = err.stack.shift().getFileName();

            if(currentfile !== callerfile) break;
        }
    } catch (e) {}

    Error.prepareStackTrace = originalFunc; 

    return callerfile;
}

C.registerModule = function (name) {
  
  if (C.m[name]) {

    console.log("Module already exists");

  } else {

    C.m[name] = new moduleTemplate;
    C.m[name].path = getCallerFile();
    Object.seal(C.m[name]);

  }

  return C.m[name];

};
