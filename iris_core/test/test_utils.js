var exports;

exports.generateString = function (stringLength) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for( var i=0; i < stringLength; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

exports.formatParams = function (params) {
    return "?" + Object
      .keys(params)
      .map(function (key) {
        return key + "=" + params[key]
      })
      .join("&")
}

module.exports = exports;
