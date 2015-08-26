C.registerModule("actions");

//Make actions directory

var fs = require("fs");

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code != 'EEXIST') throw e;
  }
}

mkdirSync(C.sitePath + "/" + "actions");

CM.actions.globals = {

  events: {},
  conditions: {},
  actions: {},


  registerEvent: function (name, event, variables, outputfunction) {

    CM.actions.globals.events[name] = {
      variables: variables
    };

    process.on(event, function (data) {

      var events = fs.readdirSync(C.sitePath + "/" + "actions");

      events.forEach(function (file) {

        event = file.split("_")[0];

        if (event === name) {

          var file = fs.readFileSync(C.sitePath + "/actions/" + file, "utf8");

          ruleSet = JSON.parse(file);

          outputfunction.call(ruleSet, data, function (eventData) {


            //Loop over conditions to generate promises

            if (ruleSet.conditions) {

              ruleSet.conditions.forEach(function (condition, index) {

                if (condition.variables) {

                  Object.keys(condition.variables).forEach(function (rawVariable) {

                    var variable = condition.variables[rawVariable];

                    //Find and swap out tokens if they match data provided by the event

                    var tokens = variable.match(/\[(.*?)\]/g);

                    if (tokens) {

                      tokens.forEach(function (token) {

                        token = token.replace("[", "").replace("]", "");

                        //Replace token if provided in event data

                        if (eventData[token]) {

                          condition.variables[rawVariable] = variable.replace("[" + token + "]", eventData[token]);

                        }
                        
                        

                      });

                    }

                  });

                  console.log(condition.variables);

                };

              });

            }

          });

        };

      });

    });

  },

  registerCondition: function () {



  },

  registerAction: function () {


  }

}

CM.actions.globals.registerEvent("hello", "hello", [{
  type: "String",
  name: "Name"
}], function (data, callback) {

  output = {
    check: data.toUpperCase()
  };

  callback(output);

});

process.emit("hello", "hello");
