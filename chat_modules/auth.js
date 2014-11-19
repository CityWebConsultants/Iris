var crypto = require('crypto');

var exports = {
    // A side effect of declaring this object is that you can have default options!
    options: {token_length: 4},
    rest:
        function (res, post) {
            var authToken;
            crypto.randomBytes(exports.options.token_length, function (ex, buf) {
                authToken = buf.toString('hex');
                res.end(authToken);
                console.log(authToken);
            });
        }
};

module.exports = exports;
