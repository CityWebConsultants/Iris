iris.promiseChain = function (tasks, parameters, success, fail) {

  tasks.reduce(function (cur, next) {
    return cur.then(next);
  }, Promise.resolve(parameters)).then(success, fail);

};

iris.promise = function (callback) {

  return function (data) {

    return new Promise(function (yes, no) {

      try {

        callback(data, yes, no);

      } catch (e) {

        console.log("--- Error in Promise ---");
        console.log(e);
        console.log("---       END        ---");

        iris.log("warn", e);
        no("error");

      }

    });

  }

};

var util = require('util');

iris.translations = {};

iris.registerTranslation = function (string, output) {

  iris.translations[string] = output;

};

iris.translate = function (translationString, arguments) {

  if (iris.translations[translationString]) {

    translationString = iris.translations[translationString];

  }

  return util.format(translationString, arguments)

}

iris.typeCheck = function (allowed, entity, data) {

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

iris.sanitizeFileName = function (name) {

  // Doesn't currently support anything not English
  return name.split(/\W/).join('-').toLowerCase();

}
