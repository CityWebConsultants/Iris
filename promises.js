var hookPromiseChain = function (tasks, parameters) {
  var success = function (data) {

    process.emit("next", data);

  };

  var fail = function (data) {

    if (data.errors) {
      data.returns = {errors: data.errors};
    } else {
      data.returns = {errors: "Unspecified error"};
    }

    console.log("[ERROR] Promise chain in " + data.hookname + " terminated with these errors:");
    data.returns.errors.forEach(function (element) {
      console.log("      - " + element);
    });

    data.returns = JSON.stringify(data.returns);

    process.emit("next", data);

  };

  promiseChain(tasks, parameters, success, fail);
}

var promiseChain = function (tasks, parameters, success, fail) {

  tasks.reduce(function (cur, next) {
    return cur.then(next);
  }, Promise.resolve(parameters)).then(success, fail);

};

global.hookPromiseChain = hookPromiseChain;
global.promiseChain = promiseChain;
