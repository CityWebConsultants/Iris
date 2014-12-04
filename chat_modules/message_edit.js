/*jslint node: true nomen: true plusplus: true */

"use strict";

/*  Message Editing Module
 *  Provides hooks and API endpoints for revoking and editing messages. Directly edits database
 *  and sends system messages to clients informing them of edits and revokes.
 *
 *  Implements hook_message_remove and hook_message_edit
 *
 *  API endpoints:
 *  /message/remove
 *  /message/edit
 */

var objectID = require('mongodb').ObjectID;

var exports = {
    hook_message_edit: {
        rank: 0,
        event: function (data) {
            var content = {};
            content[data.messagetype] = data.content;

            process.hook('hook_db_update', {
                dbcollection: 'messages',
                dbquery: {'_id': objectID(data.messageid), userid: data.userid},
                dbupdate: {$set: {'content': content}},
                dbupsert: false,
                dbmulti: false
            }, function (gotData) {
                data.returns = gotData.returns;
                process.emit('next', data);

            });
        }
    },
    hook_message_remove: {
        rank: 0,
        event: function (data) {

            process.hook('hook_db_remove', {
                dbcollection: 'messages',
                dbquery: {'_id': objectID(data.messageid), userid: data.userid}

            }, function (gotData) {
                data.returns = gotData.returns;
                process.emit('next', data);

            });
        }
    },
    hook_post_message_remove: {
        rank: 0,
        event: function (data) {
            if (data.post.userid &&
                    data.post.token &&
                    data.post.messageid &&
                    objectID.isValid(data.post.messageid)
                    ) {
                process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {

                    if (gotData.returns === true) {

                        process.hook('hook_message_remove', {
                            userid: data.post.userid,
                            messageid: data.post.messageid

                        }, function (gotData) {
                            data.returns = gotData.returns.toString();
                            process.emit('next', data);

                        });

                    } else {
                        data.returns = "ERROR: Authentication failed.";
                        process.emit('next', data);

                    }

                });
            // Missing required data
            } else {
                data.returns = "ERROR: userid, token or messageid not supplied.";
                process.emit('next', data);

            }
        }
    },
    hook_post_message_edit: {
        rank: 0,
        event: function (data) {

            // Check all data is present and that IDs are valid.
            if (data.post.userid &&
                    data.post.token &&
                    data.post.messageid &&
                    data.post.messagetype &&
                    process.config.messagetypes_enabled.indexOf(data.post.messagetype) > -1 &&
                    objectID.isValid(data.post.messageid)
                    ) {

                process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {

                    if (gotData.returns === true) {

                        process.hook('hook_message_edit', {
                            userid: data.post.userid,
                            messageid: data.post.messageid,
                            messagetype: data.post.messagetype,
                            content: data.post.content

                        }, function (gotData) {
                            data.returns = gotData.returns.toString();
                            process.emit('next', data);

                        });

                    } else {
                        data.returns = "ERROR: Authentication failed.";
                        process.emit('next', data);

                    }

                });

            // Missing required data
            } else {
                data.returns = "ERROR: userid, token, messageid, messagetype or content not supplied.";
                process.emit('next', data);

            }
        }
    }

};

module.exports = exports;
