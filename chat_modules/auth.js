/*jslint node: true */

"use strict";

/*  Auth Module
 *
 *  Provides an authentication API for integrating with a user management system
 *  (i.e. Drupal or some other CMS). Accepts the global secret key and a user ID
 *  and returns an authentication token and saves the user ID and token pair.
 *
 *  Implements the base hook hook_auth_check.
 *  Implements an API endpoint hook_post_auth (/auth)
 */

var crypto = require('crypto');

var exports = {
    //List of logged in users/access tokens
    userlist: {},
    // A side effect of declaring this object is that you can have default options!
    options: {token_length: 4},
    hook_post_auth: {
        rank: 0,
        event:
            function (data) {
            
                var authToken;
                
                if (data.post.secretkey === process.config.secret_key) {
                    crypto.randomBytes(exports.options.token_length, function (ex, buf) {
                        authToken = buf.toString('hex');
                        data.returns = authToken;
                        //~ console.log(data.returns);


                        if (data.post.userid) {
                            exports.userlist[data.post.userid] = {};
                            exports.userlist[data.post.userid].token = authToken;
                            process.emit("next", data);

                        } else {

                            data.returns = "No userid";
                            process.emit("next", data);

                        }

                    });
                } else {
                    data.returns = "Secret key invalid";
                    process.emit("next", data);
                }
            
            }
    },
    hook_auth_check: {
        rank: 0,
        event:
            function (data) {
                var userid = data.userid,
                    token = data.token;
                
                console.log(userid + ' ' + token);
                
                if (typeof userid !== 'undefined' && typeof token !== 'undefined') {
                
                    if (exports.userlist[userid] && exports.userlist[userid].token === token) {
                        data.authenticated = true;
                    } else {
                        data.authenticated = false;
                    }
                    
                } else {
                    data.authenticated = false;
                }
                
                process.emit("next", data);
            }
    }
};

module.exports = exports;
