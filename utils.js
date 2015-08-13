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

        console.log("--- Error in Promise ---");
        console.log(e);
        console.log("---       END        ---");

        C.log.warn(e);
        no("error");

      }

    }).catch(function (e) {

      console.log(e.name);

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

C.typeCheck = function (allowed, entity, data) {

  //Field type checking

  var invalidFields = [];

  Object.keys(data).forEach(function (property) {

    if (allowed[property]) {

      if (allowed[property] && (typeof entity[property] === allowed[property] || allowed[property] === "array" && Array.isArray(entity[property]))) {


      } else {

        invalidFields.push(property);

      }

    }

  });

  if (invalidFields.length > 0) {
    return {
      valid: false,
      invalidFields: invalidFields
    };
  } else {
    return {
      valid: true
    }
  }

};
