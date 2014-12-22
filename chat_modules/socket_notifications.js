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

                        process.groupBroadcast(groupid.returns, 'notification_message', {
                            messageid: data.messageid,
                            action: 'edit',
                            time: Date.now()
                        });

                        process.emit('next', data);

                    });

                } else {
                    process.emit('next', data);
                }

            });
        }
    },
    hook_message_remove: {
        rank: 0,
        event: function (data) {

            // Validate.
            process.hook('hook_db_find', {dbcollection: 'messages', dbquery: {userid: data.userid, '_id': objectID(data.messageid)}}, function (query) {

                if (query.returns && query.returns !== '[]' && JSON.parse(query.returns)[0]) {

                    process.hook('hook_groupid_from_messageid', {messageid: data.messageid}, function (groupid) {

                        process.groupBroadcast(groupid.returns, 'notification_message', {
                            messageid: data.messageid,
                            action: 'remove',
                            time: Date.now()
                        });

                        process.emit('next', data);

                    });

                } else {
                    process.emit('next', data);
                }

            });

        }
    },
    hook_post_group_add: {
        rank: 10,
        event: function (data) {

            process.groupBroadcast(data.returns, 'notification_message', {
                action: 'addgroup',
                groupid: data.returns,
                time: Date.now()
            });

            console.log('emitting next');
            process.emit('next', data);
        }
    },
    hook_group_update: {
        rank: 10,
        event: function (data) {

            switch (data.action) {
            case 'addmember':
                process.groupBroadcast(data.groupid, 'notification_message', {
                    action: 'addmember',
                    groupid: data.groupid,
                    time: Date.now()
                });
                break;
            case 'removemember':
                process.groupBroadcast(data.groupid, 'notification_message', {
                    action: 'removemember',
                    groupid: data.groupid,
                    time: Date.now()
                });
                break;
            case 'name':
                process.groupBroadcast(data.groupid, 'notification_message', {
                    action: 'name',
                    groupid: data.groupid,
                    time: Date.now()
                });
                break;
            }
        }
    }
};

module.exports = exports;
