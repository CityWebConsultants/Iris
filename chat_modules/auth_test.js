var crypto = require('crypto');

module.exports = {
  init:
     function (res, post) {
        var authToken;
        crypto.randomBytes(16, function(ex, buf) {
          authToken = buf.toString('hex');
          res.end("Auth token: " + authToken);
        })
      }
  
}


