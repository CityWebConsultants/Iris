var exports;

exports.stringifyParameters = function (object) {
  
  var newObject = {};

  Object.keys(object).forEach(function (element) {

    newObject[element] = JSON.stringify(object[element]);

  });

  return newObject;

}

module.exports = exports;
