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
    // POST /auth
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
                            process.emit('next', data);

                        } else {

                            data.returns = "No userid";
                            process.emit('next', data);

                        }

                    });
                } else {
                    data.returns = "Secret key invalid";
                    process.emit('next', data);
                }
            
            }
    },
    hook_auth_check: {
        rank: 0,
        event:
            function (data) {
                var userid = data.userid,
                    token = data.token;
                                
                if (typeof userid !== 'undefined' && typeof token !== 'undefined') {
                
                    if (exports.userlist[userid] && exports.userlist[userid].token === token) {
                        data.returns = true;
                    } else {
                        data.returns = false;
                    }
                    
                } else {
                    data.returns = false;
                }
                
                process.emit('next', data);
            }
    },
    // GET /debug/isauth
    hook_get_debug_isauth: {
        rank: 0,
        event:
            function (data) {
                var userid = data.get.userid,
                    token = data.get.token;

                console.log('user: ' + data.get.userid + ' token: ' + data.get.token);

                // Call auth_check hook
                process.hook('hook_auth_check',
                    {
                        'userid': userid,
                        'token': token,
                        callback: function (gotData) {
                            data.returns = JSON.stringify(gotData.returns);
                        }
                    });

                process.emit('next', data);
            }
    }
};

process.userlist = exports.userlist;

module.exports = exports;
