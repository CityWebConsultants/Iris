/*jslint node: true nomen: true */
"use strict";

/*  User Management Module
 *
 *  Handles user logout and online status.
 *
 */

var auth = require('../chat_modules/auth');

var exports = {
    hook_user_logout: {
        rank: 0,
        event: function (data) {
            // userid

            if (data.userid && auth.userlist && auth.userlist[data.userid]) {

                delete auth.userlist[data.userid];

                data.returns = true;
                process.emit('next', data);
            } else {

                data.returns = false;
                process.emit('next', data);
            }
        }
    },
    // POST /logout
    hook_post_logout: {
        rank: 0,
        event: function (data) {
            // userid, token

            if (data.post.userid && data.post.token) {
                process.hook('hook_user_logout', {userid: data.post.userid, token: data.post.token}, function (gotData) {
                    if (gotData.returns === true) {
                        data.returns = 'true';
                        process.emit('next', data);
                    } else {
                        data.returns = "ERROR: User could not be logged out. (Do they actually exist?)";
                        process.emit('next', data);
                    }

                });
            } else {

                data.returns = "ERROR: Missing userid or token";
                process.emit('next', data);
            }
        }
    }

};

module.exports = exports;
