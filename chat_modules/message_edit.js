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
    hook_message_remove: {
        rank: 0,
        event: function (data) {

        }
    },
    hook_message_edit: {
        rank: 0,
        event: function (data) {
            // data.messageid, data.userid



            data.returns = data;
            process.emit('next', data);
        }
    },
    hook_post_message_remove: {
        rank: 0,
        event: function (data) {
            if (data.post.userid && data.post.token && data.post.messageid) {
                process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {

                    if (gotData.returns === true) {

                        process.hook('hook_db_update', {

                        }, function (gotData) {

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
        event: function (data) { // if required data is there and messagetype is enabled

            console.log(objectID.isValid(data.post.messageid));

            if (data.post.userid &&
                    data.post.token &&
                    data.post.messageid &&
                    data.post.messagetype &&
                    process.config.messagetypes_enabled.indexOf(data.post.messagetype) > -1 &&
                    objectID.isValid(data.post.messageid)
                    ) {

                process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {

                    if (gotData.returns === true) {
                        var content = {};
                        content[data.post.messagetype] = data.post.content;

                        process.hook('hook_db_update', {
                            dbcollection: 'messages',
                            dbquery: {'_id': objectID(data.post.messageid), userid: data.post.userid},
                            dbupdate: {$set: {'content': content}},
                            dbupsert: false,
                            dbmulti: false
                        }, function (gotData) {

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
