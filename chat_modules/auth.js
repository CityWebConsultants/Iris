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
    options: {token_length: 16, allowdebug: false},
    // Global functions
    globals: {
      testGlobal: function (data) {
        console.log("Hello world");
      }
    },
    // POST /auth
    hook_post_auth: {
        rank: 0,
        event:
            function (data) {

                var authToken;

                if (data.post.userid && data.post.apikey && data.post.secretkey) {

                    process.hook("hook_secretkey_check", {
                        apikey: data.post.apikey,
                        secretkey: data.post.secretkey
                    }, function (check) {

                        if (check.returns) {
                            crypto.randomBytes(exports.options.token_length, function (ex, buf) {
                                authToken = buf.toString('hex');

                                //Create new user if not in existence

                                if (!exports.userlist[data.post.userid]) {
                                    exports.userlist[data.post.userid] = {};

                                }

                                //Check if no tokens already set and create array

                                if (!exports.userlist[data.post.userid].tokens) {
                                    exports.userlist[data.post.userid].tokens = [];
                                }

                                exports.userlist[data.post.userid].tokens.push(authToken);
                                data.returns = authToken;
                                process.emit('next', data);
                            });
                        } else {
                            data.returns = "Secret key pair invalid.";
                            process.emit("next", data);
                        }

                    });

                } else {
                    data.returns = "ERROR: Not all data provided";
                    process.emit('next', data);
                }

            }
    },
    hook_auth_check: {
        rank: 0,
        event:
            function (data) {
                var user = exports.userlist[data.userid],
                    token = data.token,
                    authenticated = false;

                if (user) {

                    //Loop over tokens

                    user.tokens.forEach(function (element) {

                        if (token === element) {

                            authenticated = true;

                        }

                    });

                    data.returns = authenticated;

                    process.emit('next', data);

                } else {

                    data.returns = false;
                    process.emit('next', data);

                }

            }
    },
    hook_secretkey_check: {
        rank: 0,
        event:
            function (data) {
                // secretkey only
                if (data.secretkey === process.config.secretkey && data.apikey === process.config.apikey) {
                    data.returns = true;
                    process.emit('next', data);
                } else {
                    data.returns = false;
                    process.emit('next', data);
                }
            }
    },
    // GET /debug/isauth
    hook_get_debug_isauth: {
        rank: 0,
        event:
            function (data) {
                if (exports.options && exports.options.allowdebug) {
                    var userid = data.get.userid,
                        token = data.get.token;

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

                } else {
                    data.returns = 'ERROR: Feature disabled.';
                    process.emit('next', data);
                }
            }
    },
    // GET /debug/userlist
    hook_get_debug_userlist: {
        rank: 0,
        event:
            function (data) {
                var index;

                if (exports.options && exports.options.allowdebug) {

                    data.returns = JSON.stringify(Object.keys(exports.userlist));

                    process.emit('next', data);

                } else {
                    data.returns = 'ERROR: Feature disabled.';
                    process.emit('next', data);
                }
            }
    }
};

process.userlist = exports.userlist;

module.exports = exports;
