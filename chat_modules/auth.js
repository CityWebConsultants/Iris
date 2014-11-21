var crypto = require('crypto');

var exports = {
    // A side effect of declaring this object is that you can have default options!
    options: {token_length: 4},
    hook_post_auth: {
        rank: 2,
        event:
            function (data) {
                var url = data.url;
                var post = data.post;
                var res = data.res;
            
                var authToken;
                crypto.randomBytes(exports.options.token_length, function (ex, buf) {
                    authToken = buf.toString('hex');
                    data.returns = authToken;
                    //~ console.log(data.returns);
                    
                    process.nextTick(function () {
                        process.emit("next", data);
                    });
                });
            
            }
        }
};

module.exports = exports;
