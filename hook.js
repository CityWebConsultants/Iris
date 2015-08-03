var hook = function (hookname, data, auth) {

  return new Promise(function (yes, no) {

    var modules = [];
    var hookcalls = [];

    // Loop over all installed node.js modules 
    Object.keys(require('module')._cache).forEach(function (element, index) {

      modules.push(require(element));

    });

    //Add modules to the array if they contain the triggered event

    modules.forEach(function (hookcall, index) {

      if (hookcall[hookname]) {

        hookcalls.push(hookcall[hookname]);

      }

    });


    //If no hook fail promise

    if (!hookcalls.length) {

      no(data);

    }

    //Sort the modules in order of the rank of that event function within them

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

    hookcalls.forEach(function (hookcall) {

      hookCallPromises.push(function (vars) {

        return new Promise(function (yes, no) {

          var self = {};

          self.finish = function (outcome, output) {

            if (outcome) {

              yes(output);

            } else {

              no(output);

            }

          };

          self.auth = auth;

          hookcall.event.call(self, vars);

        });

      });

    });

    //Hookcalls are now sorted, ready to be run

    promiseChain(hookCallPromises, data, yes, no);

  });

};

module.exports = hook;
