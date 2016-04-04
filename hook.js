/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

/**
 * @file Implements the hook invocation function for the hook system.
 */

/**
 * @memberof iris
 *
 * @desc Invokes a hook.
 *
 * All implementations of this hook, across all modules, will be run in order.
 *
 * The 'variables' object is passed between each hook and is mutable - it can be assigned different values by each hook.
 * The other parameters are kept static. 'Variables' are what is returned once the hook is complete.
 *
 * @param {string} hookname - The unique name of the hook to run
 * @param {object} authPass - The authPass object, which includes permissions information about the current user. Use string "root" to run with all permissions.
 * @param {object} staticVariables - Variables provided to the hook implementations which should not be mutable
 * @param {object} variables - Variables provided to the hook implementations which are mutable
 *
 * @returns a promise which, if successful, contains the final hook variables as its first argument
 */
var hook = function (hookname, authPass, staticVariables, variables) {

  "use strict";

  var auth = authPass,
    thisHook,
    constants = staticVariables,
    data = variables;

  // TODO should probably clone static variables so they're proper constants and can't be changed elsewhere

  return new Promise(function (yes, no) {

    //Check auth

    if (typeof auth === 'string' || auth instanceof String) {

      if (auth === "root") {

        auth = {

          userid: "root",
          roles: ["admin"]

        };

      } else if (auth === "anon") {

        auth = {

          userid: "anon",
          roles: ["anonymous"]

        };

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

      yes(data);

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

    var hookCallPromises = [];

    hookcalls.forEach(function (hookcall, index) {

      hookCallPromises.push(function (vars) {

        return new Promise(function (yes, no) {

          thisHook = {};

          thisHook.pass = function (output) {

            yes(output);

          };

          thisHook.fail = function (output) {

            no(output);

          };

          thisHook.authPass = auth;

          if (constants && constants.req) {

            thisHook.req = constants.req;

          }

          // TODO - const is a reserved word!

          thisHook.context = constants;
          thisHook.name = hookcall.name;
          thisHook.path = hookcall.parentModule;
          thisHook.rank = hookcall.rank;
          thisHook.index = index;

          try {
            hookcall.event(thisHook, vars);
          } catch (e) {
            if (e.stack) {
              iris.log("error", "Error when calling hook " + thisHook.name + " from " + thisHook.path + " on line " + e.stack[0].getLineNumber() + " of " + e.stack[0].getFileName() + " " + e.message);
            }
            no("Hook error");
          }

        });

      });

    });

    //Hookcalls are now sorted, ready to be run

    iris.promiseChain(hookCallPromises, data, yes, no);

  });

};

module.exports = hook;
