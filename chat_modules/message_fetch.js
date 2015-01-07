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
    hook_get_group_unread: {

        rank: 0,
        event: function (data) {
            // expects groupid, userid, token

            if (data.get.userid && data.get.token) {

                if (data.get.date) {

                    data.get.date = parseInt(data.get.date, 10);
                    data.get.date = new Date(data.get.date);
                }

                process.hook('hook_auth_check', {userid: data.get.userid, token: data.get.token}, function (authorised) {
                    if (authorised.returns === true) {

                        var groups = [],
                          query = {};

                        process.hook('hook_fetch_groups', {userid: data.get.userid, token: data.get.token}, function (group) {

                            JSON.parse(group.returns).forEach(function (element) {
                                groups.push(element._id);
                            });

                            if (data.get.date) {
                                query._id = {$gt: exports.objectIDWithTimestamp(data.get.date)};
                            }

                            //Don't load own messages if self is set to false

                            if (data.get.self === "false") {
                                query.userid = {$ne: data.get.userid};
                            }

                            query.groupid = {$in: groups};

                            process.hook('hook_db_find', {
                                dbcollection: 'messages',
                                dbquery: query
                            }, function (gotData) {

                                if (gotData.returns !== '[]') {

                                    var messages =  JSON.parse(gotData.returns);
                                    data.returns = {};

                                    //Loop over all returned messages and create a message counter for each group

                                    messages.forEach(function (element) {
                                        if (!data.returns[element.groupid]) {
                                            data.returns[element.groupid] = 1;
                                        } else {
                                            data.returns[element.groupid] += 1;
                                        }

                                    });

                                    data.returns = JSON.stringify(data.returns);

                                } else {

                                    data.returns = "0";

                                }

                                process.emit('next', data);
                            });
                        });
                    } else {

                        data.returns = "error";
                        process.emit('next', data);

                    }

                });

            } else {

                data.returns = "error";
                process.emit("next", data);

            }

        }
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
                data.returns = "ERROR: Missing groupid, userid or token";
                process.emit('next', data);
            }

        }
    },
    hook_get_fetch_message: {
        rank: 0,
        event: function (data) {
            // userid, token, messageid
            if (data.get.userid && data.get.token && data.get.messageid && objectID.isValid(data.get.messageid)) {
                process.hook('hook_auth_check', {userid: data.get.userid, token: data.get.token}, function (authorised) {
                    if (authorised.returns === true) {
                        process.hook('hook_groupid_from_messageid', {messageid: data.get.messageid}, function (groupid) {
                            if (groupid.returns) {
                                process.hook('hook_db_find', {
                                    dbcollection: 'groups',
                                    dbquery: {'_id': objectID(groupid.returns), members: {$elemMatch: {'userid': data.get.userid}}}
                                }, function (groupinfo) {
                                    if (groupinfo.returns && groupinfo.returns !== '[]') {

                                        process.hook('hook_db_find', {
                                            dbcollection: 'messages',
                                            dbquery: {'_id': objectID(data.get.messageid)}
                                        }, function (message) {
                                            data.returns = message.returns;
                                            process.emit('next', data);
                                        });

                                    } else {
                                        data.returns = "ERROR: Not authorised to view this message.";
                                        process.emit('next', data);
                                    }
                                });
                            } else {
                                data.returns = "ERROR: Could not fetch associated group.";
                                process.emit('next', data);
                            }
                        });
                    } else {
                        data.returns = "ERROR: Authentication failed.";
                        process.emit('next', data);
                    }
                });
            } else {
                data.returns = "ERROR: Missing messageid, userid or token";
                process.emit('next', data);
            }
        }
    }
};

module.exports = exports;
