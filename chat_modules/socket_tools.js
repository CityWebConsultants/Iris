/*jslint node: true plusplus: true*/
"use strict";

/*  Socket Tools Module
 *  Provides some useful socket functions not implemented by the base Sockets module.
 *
 *  Provides hook_groupid_from_messageid and hook_socket_users_push
 */

var objectID = require('mongodb').ObjectID;

var exports = {
    alive: [],
    aliveData: [],
    recentActivity: [],

    options: {
        awayCleanupTime: 30000
    },

    init: function () {
        //Listen out for keepalive
        process.addSocketListener("alive", function (data, socket) {
            // Ignore undefined userid
            // Prepend to alive data array
            if (socket.userid) {
                exports.aliveData.unshift({userid: socket.userid, timestamp: Date.now()});
            }
        });

        // Every whatever interval, run cleanup
        setInterval(function () {
            var i = 0;
            console.log(exports.aliveData);
            console.log(exports.alive);
            exports.alive = [];
            // fire event for pushing online users?

            for (i = 0; i < exports.aliveData.length; i++) {
                if (exports.alive.indexOf(exports.aliveData[i].userid) === -1) {
                    exports.alive.push(exports.aliveData[i].userid);
                }

                if (Date.now() - exports.aliveData[i].timestamp > exports.options.awayCleanupTime) {
                    //console.log('cleanup ' + exports.aliveData[i]);
                    exports.aliveData.length = i;
                    break;
                }
            }

        }, 10000);
    },
    hook_onlineusers: {
        rank: 0,
        event: function (data) {
            data.returns = exports.alive;
            process.emit('next', data);
        }
    },
    // GET /onlineusers
    hook_get_onlineusers: {
        rank: 0,
        event: function (data) {
            process.hook('hook_onlineusers', {}, function (users) {
                data.returns = JSON.stringify(users.returns);
                process.emit('next', data);
            });
        }
    },
    hook_groupid_from_messageid: {
        rank: 0,
        event: function (data) {
            var messageid = objectID(data.messageid);

            process.hook('hook_db_find', {
                dbcollection: 'messages',
                dbquery: {'_id': messageid}
            }, function (gotData) {
                data.returns = JSON.parse(gotData.returns)[0].groupid;
                process.emit('next', data);
            });
        }
    }
};

module.exports = exports;
