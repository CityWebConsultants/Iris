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
    process.emit("next", data);

  };

  promiseChain(tasks, parameters, success, fail);
}

var promiseChain = function (tasks, parameters, success, fail) {

  tasks.reduce(function (cur, next) {
    return cur.then(next);
  }, Promise.resolve(parameters)).then(success, fail);

};

process.hookPromiseChain = hookPromiseChain;
process.promiseChain = promiseChain;
