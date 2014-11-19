var crypto = require('crypto');

module.exports = {
  rest:
     function (res, post, options) {
        var authToken;
        crypto.randomBytes(options.token_length, function(ex, buf) {
          authToken = buf.toString('hex');
          res.end(authToken);
        })
      }
}


