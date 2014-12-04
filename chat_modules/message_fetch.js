/*jslint node: true nomen: true */
"use strict";

/*  Message Fetch Module
 *  Provides an API endpoint for fetching all messages tied to a particular group.
 *
 *
 */

var objectID = require('mongodb').ObjectID;

var exports = {
    options: {},
    // Create objectID from timestamp for use in 'since' queries.
    objectIDWithTimestamp: function (timestamp) {
        // Convert string date to Date object (otherwise assume timestamp is a date)
        if (typeof (timestamp) === 'string') {
            timestamp = new Date(timestamp);
        }

        // Convert date object to hex seconds since Unix epoch
        var hexSeconds = Math.floor(timestamp / 1000).toString(16),
            constructedObjectID = objectID(hexSeconds + "0000000000000000");

        return constructedObjectID;
    },
    hook_group_list_messages: {
        rank: 0,
        event: function (data) {
            // expects groupid, optional (since)
            var query = {groupid: data.groupid};

            if (data.since) {
                query._id = {$gt: exports.objectIDWithTimestamp(data.since)};
            }

            process.hook('hook_db_find', {dbcollection: 'messages', dbquery: query}, function (gotData) {
//                console.log(JSON.stringify(gotData.returns));
                data.returns = gotData.returns;
                process.emit('next', data);
            });
        }
    },
    // GET /fetch/group/messages
    hook_get_fetch_group_messages: {
        rank: 0,
        event: function (data) {
            // expects groupid, userid & token, optional (since)
            if (data.get.groupid && data.get.userid && data.get.token) {

                process.hook('hook_auth_check', {userid: data.get.userid, token: data.get.token}, function (authorised) {
                    if (authorised.returns === true) {
                        var query = {groupid: data.get.groupid};

                        if (data.get.since && new Date(data.get.since).getTime() > 0) {
                            query.since = data.get.since;
                        }

                        process.hook("hook_group_list_messages", query, function (gotData) {
                            data.returns = gotData.returns;
                            process.emit('next', data);
                        });
                    } else {
                        data.returns = "ERROR: Authentication failed.";
                        process.emit('next', data);
                    }
                });


            } else {
                data.returns = "ERROR: Missing group id, user id or token";
                process.emit('next', data);
            }

        }
    }
};

module.exports = exports;
