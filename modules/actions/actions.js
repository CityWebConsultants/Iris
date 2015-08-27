C.registerModule("actions");

//Make actions directory

var fs = require("fs");

CM.actions.globals = {

  events: {},
  conditions: {},
  actions: {},


  registerEvent: function (name, event, variables, outputfunction) {

    CM.actions.globals.events[name] = {
      variables: variables
    };

    process.on(event, function (data) {

      var events = fs.readdirSync(C.sitePath + "/configurations/" + "actions");

      events.forEach(function (file) {

        event = file.split("_")[0];

        if (event === name) {

          var file = fs.readFileSync(C.sitePath + "/configurations/actions/" + file, "utf8");

          ruleSet = JSON.parse(file);

          outputfunction.call(ruleSet, data, function (eventData) {

            //Loop over conditions to generate promises

            if (ruleSet.conditions) {

              var tests = [];

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

                  tests.push(C.promise(function (data, yes, no) {

                    CM.actions.globals.conditions[condition.name].test(condition.variables).then(function () {

                      yes();

                    }, function () {

                      no();

                    });

                  }));

                };

              });

              var success = function () {

                console.log("success");

              };

              var fail = function () {

                console.log("fail");

              };

              C.promiseChain(tests, null, success, fail);

            }

          });

        };

      });

    });

  },

  registerCondition: function (name, variables, testPromise) {

    CM.actions.globals.conditions[name] = {
      variables: variables,
      test: testPromise
    };

  },

  registerAction: function () {


  }

}

CM.actions.globals.registerEvent("newblogpost", "New blog post", [{
  type: "String",
  name: "Blog title"
}], function (data, callback) {

  output = {
    check: data
  };

  callback(output);

});

CM.actions.globals.registerCondition("Check title", [{
  type: "String",
  name: "Title"
}], C.promise(function (data, yes, no) {

  if (data.name === "hello") {

    yes(data);

  } else {

    no();

  };

}));

process.emit("hello", "hello");
