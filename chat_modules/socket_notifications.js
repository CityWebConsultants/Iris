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
            console.log('This should run first.');
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
    }
};

module.exports = exports;
