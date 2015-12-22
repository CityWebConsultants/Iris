var hook = function (hookname, authPass, static, variables) {

  var auth = authPass;
  
  var thisHook;

  var constants = static;

  var data = variables;

  return new Promise(function (yes, no) {

    //Check auth
    
    if (typeof auth === 'string' || auth instanceof String) {

      if (auth === "root") {

        auth = {

          userid: "root",
          roles: ["admin"]

        }

      } else {

        no("invalid authPass");
        return false;

      }

    } else if (!auth || !auth.roles || !auth.userid) {
      
      no("invalid authPass");
      return false;

    }

    var hookcalls = [];

    // Loop over all installed modules and check if hook is present

    Object.keys(iris.modules).forEach(function (element) {

      var moduleHooks = iris.modules[element].hooks;

      if (moduleHooks[hookname]) {

        var hookcall = {

          event: moduleHooks[hookname].event,
          parentModule: element,
          name: hookname,
          rank: moduleHooks[hookname].rank

        };

        hookcalls.push(hookcall);

      }

    });

    //If no hook fail promise

    if (!hookcalls.length) {

      no("No such hook exists");

    }

    //Sort the hooks in order of rank

    hookcalls.sort(function (a, b) {

      if (a.rank > b.rank) {
        return 1;
      }

      if (a.rank < b.rank) {
        return -1;
      }

      return 0;

    });

    //Create a promise for each of the hooks with a finishing function for success and failure, pass in auth parameters

    hookCallPromises = [];

    hookcalls.forEach(function (hookcall, index) {

      hookCallPromises.push(function (vars) {

        return new Promise(function (yes, no) {

          thisHook = {};

          thisHook.finish = function (outcome, output) {

            if (outcome) {

              yes(output);

            } else {

              no(output);

            }

          };

          thisHook.authPass = auth;

          if (constants && constants.req) {

            thisHook.req = constants.req;

          }

          thisHook.const = constants;
          thisHook.name = hookcall.name;
          thisHook.path = hookcall.parentModule;
          thisHook.rank = hookcall.rank;
          thisHook.index = index;
          
          try {
            hookcall.event(thisHook, vars);
          } catch (e) {
            console.log("***********");
            console.log("Hook error");
            console.log("hook: " + thisHook.name);
            console.log("path: " + thisHook.path);
            console.log("rank: " + thisHook.rank);
            console.log("index: " + thisHook.index);
            console.log("authPass:");
            console.log(thisHook.authPass);
            console.log("message:");
            if (e.stack) {
              iris.log("error", "Error on line " + e.stack[0].getLineNumber() + " of " + e.stack[0].getFileName() + " " + e.message);
            }
            console.log("***********");
            no("ERROR");
          }

        });

      });

    });

    //Hookcalls are now sorted, ready to be run

    iris.promiseChain(hookCallPromises, data, yes, no);

  });

};

module.exports = hook;
