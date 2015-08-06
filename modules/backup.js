/*jslint node: true nomen: true*/
"use strict";

/*  Backup Module
 *
 *  Export stuff.
 *  The original intention was to offer this upon removal of a group.
 *  TODO: move stuff into here
 */

var objectID = require('mongodb').ObjectID;

var exports = {
    options: {},
    hook_backup: {
        rank: 0,
        event: function (data) {
            var dump = {};

            // Get all the group information
            hook('hook_db_find', {
                dbcollection: 'groups',
                dbquery: {'_id': objectID(data.post.groupid), 'isReadOnly': true}
            }, function (groupDump) {
                dump.group = JSON.parse(groupDump.returns);

                // Get all the messages
                hook('hook_db_find', {
                    dbcollection: 'messages',
                    dbquery: {groupid: data.post.groupid}
                }, function (messagesDump) {
                    dump.messages = JSON.parse(messagesDump.returns);

                });

            });
        }
    }
};

module.exports = exports;
