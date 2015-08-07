//Promisechains

C.promiseChain = function (tasks, parameters, success, fail) {

  tasks.reduce(function (cur, next) {
    return cur.then(next);
  }, Promise.resolve(parameters)).then(success, fail);

};

C.promise = function (callback) {

  return function (data) {

    return new Promise(function (yes, no) {

      try {

        callback(data, yes, no);

      } catch (e) {

        console.log(e);
        no("error");

      }

    });

  }

};
