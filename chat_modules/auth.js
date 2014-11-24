/*jslint node: true */

"use strict";

var crypto = require('crypto');

var exports = {
    //List of logged in users/access tokens
    tokens: {},
    // A side effect of declaring this object is that you can have default options!
    options: {token_length: 4},
    hook_post_auth: {
        rank: 0,
        event:
            function (data) {
            
                var authToken;
                
                crypto.randomBytes(exports.options.token_length, function (ex, buf) {
                    authToken = buf.toString('hex');
                    data.returns = authToken;
                    //~ console.log(data.returns);
                    
                    process.nextTick(function () {
                        
                        if (data.post.userid) {
                            
                            exports.tokens[data.post.userid] = authToken;
                            process.emit("next", data);
                            
                        } else {
                            
                            data.returns = "No userid";
                            process.emit("next", data);
                            
                        }
                        
                    });
                });
            
            }
    }
};

module.exports = exports;
