/*jslint node: true */
"use strict";

/*  Socket Notifications Module
 *  Pushes notifications to the client informing them of message revocation or editing.
 *
 *  Implements hook_message_edit and hook_message_remove.
 */

var auth = require('../chat_modules/auth');

var exports = {
    options: {notify_edit: true, notify_delete: true, silent: true},
    hook_message_edit: {
        rank: 10,
        event: function (data) {
            console.log(auth.userlist);

            // If a message actually was edited...
            if (data.returns === '1') {

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

            // Done & move on
            process.emit('next', data);
        }
    },
    hook_message_remove: {
        rank: 10,
        event: function (data) {
            console.log(data);
            // If a message actually was removed...
            if (data.returns === '1') {
                process.socketio.sockets.emit('notification_message', {messageid: data.messageid, action: 'remove'});
            }
            // Done & move on
            process.emit('next', data);
        }
    }
};

module.exports = exports;
