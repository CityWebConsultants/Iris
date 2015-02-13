/*jslint node: true plusplus: true*/
"use strict";

/*  Activity Module
 *
 *  Provides tracking of user 'alive' messages. Presents hook hook_onlineusers and a corresponding
 *  API endpoint, /onlineusers. Pushes socket message online_users.
 *
 */
var objectID = require('mongodb').ObjectID;

var exports = {
    alive: [],
    aliveData: [],
    alivePushed: [],
    recentActivity: [],

    arraysEqual: function (a, b) {
        if (a === b) {
            return true;
        }
        if (a === null || b === null) {
            return false;
        }
        if (a.length !== b.length) {
            return false;
        }

        a.sort();
        b.sort();

        var i;
        for (i = 0; i < a.length; ++i) {
            if (a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    },

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

        process.addSocketListener("groupcheckin", function (data, socket) {
            if (data.userid && data.token && data.groupid) {
                process.hook("hook_auth_check", {userid: data.userid, token: data.token}, function (auth) {
                    if (auth.returns === true) {
                        // Run checkin hook
                        process.hook("hook_group_checkin", {userid: data.userid, groupid: data.groupid}, function (returns) {
                            data.returns = true;
                        });
                    }
                });
            }
        });

        // Every whatever interval, run cleanup
        setInterval(function () {
            var i = 0;
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

            // If the array actually changed since last time...
            if (!exports.arraysEqual(exports.alivePushed, exports.alive)) {
//                console.log('Alive array updated.');
                process.socketio.sockets.emit('users_online', {users: exports.alive});

                // Update pushed copy to what we just pushed
                exports.alivePushed = exports.alive;
            }

        }, 2000); // usually 10s
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
    hook_group_checkin: {
        rank: 0,
        event: function (data) {
            // userid, groupid
            process.hook('hook_db_update', {
                dbcollection: 'groups',
                dbquery: {'_id': objectID(data.groupid), 'members.userid': data.userid},
                dbupdate: {$set: {'members.$.lastviewed': Date.now()}}
            }, function (result) {
                data.returns = result.returns;
                process.emit('next', data);
            });
        }
    },
    hook_message_add: {
        rank: 20,
        event: function (data) {
            // If message added successfully, i.e. previous hook actually returned
            if (data.returns) {
                process.hook('hook_db_update', {
                    dbcollection: 'groups',
                    dbquery: {'_id': objectID(data.groupid)},
                    dbupdate: {'$set': {'lastupdated': Date.now()}}
                }, function (result) {
                    process.emit('next', data);
                });
            }
        }
    },
    hook_group_add: {
        rank: 20,
        event: function (data) {
            // If group added successfully
            if (data.success === true) {
                process.hook('hook_db_update', {
                    dbcollection: 'groups',
                    dbquery: {'_id': objectID(data.returns.toString())},
                    dbupdate: {'$set': {'lastupdated': Date.now()}}
                }, function (result) {
                    process.emit('next', data);
                });
            } else {
                process.emit('next', data);
            }
        }
    }
};

module.exports = exports;
