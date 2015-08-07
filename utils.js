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

        C.log.warn(e);
        no("error");

      }

    });

  }

};

var util = require('util');

C.translations = {};

C.registerTranslation = function (string, output) {

  C.translations[string] = output;

};

C.translate = function (translationString, arguments) {

  if (C.translations[translationString]) {

    translationString = C.translations[translationString];

  }

  return util.format(translationString, arguments)

}
