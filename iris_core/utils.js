/**
 * @file General utility functions used throughout
 */

/**
 * @namespace iris
 * @desc Utility functions and Iris system calls
 */

/**
 * @function promiseChain
 * @memberof iris
 *
 * @desc Run a series of promises in sequence.
 *
 * If any promise fails, the chain is stopped and the failure callback is run.
 *
 * @param {promise[]} tasks - array of promises to be resolved
 * @param parameters - arguments to pass to each promise
 * @param success - success callback to run if all promises are successful
 * @param fail - failure callback to run if any promise is unsuccessful
 */
iris.promiseChain = function (tasks, parameters, success, fail) {

  tasks.reduce(function (cur, next) {
    return cur.then(next);
  }, Promise.resolve(parameters)).then(success, fail);

};

/**
 * @function promise
 * @memberof iris
 *
 * @desc Run given callback as a promise.
 *
 * Pretty prints any errors that occur inside the callback.
 *
 * @params {function} callback - callback to run
 *
 * @returns a promise that runs the specified callback
 */
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

/**
 * @function registerTranslation
 * @memberof iris
 *
 * @desc Register a translation to be used by the translate function
 *
 * @params {string} language - output language of the translation
 * @params {string} input - string that should be translated
 * @params {string} output - string to replace the initial string with in order to translate it
 */

iris.registerTranslation = function (language, input, output) {

  if (!iris.translations[language]) {

    iris.translations[language] = {};

  }

  iris.translations[language][input] = output;

};

/**
 * @function translate
 * @memberof iris
 *
 * @desc Translate a string
 *
 * If a translation for the given string has been registered, the input string will be replaced with that one.
 *
 * @param {string} translationString - string that should be translated
 * @param args - util.format arguments to replace inside string
 *
 * @returns Translated string with arguments processed by util.format
 */
iris.t = function (translationString, args, language) {

  if (typeof args === "string") {

    language = args;
    args = null;

  }

  if (iris.translations[language] && iris.translations[language][translationString]) {

    translationString = iris.translations[language][translationString];

  }

  if (!args) {

    args = {};

  }

  Object.keys(args).forEach(function (argument) {

    translationString = translationString.split("%" + argument).join(args[argument]);

  })

  return translationString;

}

// Example

//iris.registerTranslation("german", "Hello %first %second", "Hallo %second %first");
//iris.registerTranslation("german", "Hello user", "User hallo!");
//
//console.log(iris.t("Hello user", "german"));
//console.log(iris.t("Hello %first %second", {
//  first: "Filip",
//  second: "Hnízdo"
//}, "german"));

/**
 * @function typeCheck
 * @memberof iris
 *
 * @desc Field data type check
 *
 * @param {object} allowed - object containing key-value pairs of the field name and its allowed type
 * @param {object} entity - the entity to check
 * @param {object} data#
 *
 * @returns an object with parameter 'valid' as a boolean; if invalid, an array of invalidFields is also provided
 */
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

/**
 * @function sanitizeName
 * @memberof iris
 *
 * @desc Sanitize file name
 *
 * Replaces all non alphanumeric characters with '-'. This is a problem with non-Latin scripts.
 *
 * @param {string} name - string to convert into a sanitized filename
 *
 * @returns a sanitized string ready for use as a filename
 */
iris.sanitizeName = function (name) {

  // Doesn't currently support anything not English
  return name.replace(/[^a-zA-Z]+/g, '_').toLowerCase();

}

iris.sanitizeEmbeds = function (html) {

  html = html.split("[[[").join("&#91;&#91;&#91;");
  html = html.split("]]]").join("&#93;&#93;&#93;");

  html = html.split("{{").join("&#123;&#123;");
  html = html.split("}}").join("&#125;&#123;");

  html = html.split("{{{").join("&#123;&#123;&#123;");
  html = html.split("}}}").join("&#125;&#125;&#125;");

  return html;

}
