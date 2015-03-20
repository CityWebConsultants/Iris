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

    init: function () {
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
