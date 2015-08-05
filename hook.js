var hook = function (hookname, data, authPass) {
    
  var auth = authPass;
  
  return new Promise(function (yes, no) {

    //Check auth

    if (typeof auth === 'string' || auth instanceof String) {

      if (auth === "root") {

        auth = {

          userid: "root",
          roles: ["authenticated"]

        }

      } else {

        no("invalid authPass");
        return false;

      }

    } else if (!auth || !auth.roles || !auth.userid) {

      no("invalid authPass");
      return false;

    }

    var modules = [];
    var hookcalls = [];

    // Loop over all installed node.js modules and check if hook is present

    Object.keys(require('module')._cache).forEach(function (element, index) {
      
      var moduleContents = require(element);

      if (moduleContents[hookname]) {

        var hookcall = {

          event: moduleContents[hookname].event,
          parentModule: element,
          rank: moduleContents[hookname].rank

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

          thisHook.path = hookcall.parentModule;
          thisHook.rank = hookcall.rank;
          thisHook.index = index;

          try {
            hookcall.event(thisHook, vars);
          } catch (e) {
            console.log("***********");
            console.log("Hook error");
            console.log("hook: " + hookname);
            console.log("path: " + thisHook.path);
            console.log("rank: " + thisHook.rank);
            console.log("index: " + thisHook.index);
            console.log("authPass:");
            console.log(thisHook.authPass);
            console.log("message:");
            console.log(e);
            console.log("***********");
            no("ERROR");
          }

        });

      });

    });

    //Hookcalls are now sorted, ready to be run

    C.promiseChain(hookCallPromises, data, yes, no);

  });

};

module.exports = hook;
