/*jslint node: true */
"use strict";

/*  Socket Notifications Module
 *  Pushes notifications to the client informing them of message revocation or editing.
 *
 *  Implements hook_message_edit and hook_message_remove.
 */

var auth = require('../chat_modules/auth');
var objectID = require('mongodb').ObjectID;

var exports = {
    options: {notify_edit: true, notify_delete: true, silent: true},
    hook_message_edit: {
        rank: 0,
        event: function (data) {

            // Validate.
            process.hook('hook_db_find', {dbcollection: 'messages', dbquery: {userid: data.userid, '_id': objectID(data.messageid)}}, function (query) {

                if (query.returns && query.returns !== '[]' && JSON.parse(query.returns)[0]) {

                    process.hook('hook_groupid_from_messageid', {messageid: data.messageid}, function (groupid) {

                        process.hook('hook_group_list_users', {groupid: groupid.returns}, function (groupusers) {

                            if (groupusers.returns && groupusers.returns[0]) {

                                // Push message to all users
                                process.hook('hook_socket_users_push', {
                                    users: groupusers.returns,
                                    socketname: 'notification_message',
                                    messageobject: {
                                        messageid: data.messageid,
                                        action: 'edit',
                                        time: Date.now()
                                    }
                                });

                            }

                        });
                    });

                }

            });

            // Done & move on
            process.emit('next', data);
        }
    },
    hook_message_remove: {
        rank: 0,
        event: function (data) {
            console.log('This should run first.');
            // Validate.
            process.hook('hook_db_find', {dbcollection: 'messages', dbquery: {userid: data.userid, '_id': objectID(data.messageid)}}, function (query) {

                console.log(query);

                if (query.returns && query.returns !== '[]' && JSON.parse(query.returns)[0]) {

                    console.log("attempting to look at message...");

                    process.hook('hook_groupid_from_messageid', {messageid: data.messageid}, function (groupid) {

                        process.hook('hook_group_list_users', {groupid: groupid.returns}, function (groupusers) {
                            console.log(groupusers.returns);

                            if (groupusers.returns && groupusers.returns[0]) {

                                // Push message to all users
                                process.hook('hook_socket_users_push', {
                                    users: groupusers.returns,
                                    socketname: 'notification_message',
                                    messageobject: {
                                        messageid: data.messageid,
                                        action: 'remove',
                                        time: Date.now()
                                    }
                                }, function (push) {
                                    process.emit('next', data);
                                });

                            // No groupusers
                            } else {
                                process.emit('next', data);
                            }

                        });
                    });

                } else {
                    console.log('Message didn\'t exist');
                    process.emit('next', data);
                }

            });

        }
    }
};

module.exports = exports;
