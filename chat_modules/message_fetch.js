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

            if ((data.get.userid && data.get.token) || (data.get.secretkey && data.get.apikey)) {

                process.hook('hook_auth_check', {
                    userid: data.get.userid,
                    token: data.get.token
                }, function (authorised) {
                    if (authorised.returns === true || (data.get.secretkey === process.config.secretkey && data.get.apikey === process.config.apikey)) {

                        var groups = [],
                            groupactivity = {},
                            query = {};

                        process.hook('hook_fetch_groups', {
                            userid: data.get.userid
                        }, function (group) {
                            JSON.parse(group.returns).forEach(function (element) {

                                //Loop over all the members of each group and return the last updated time for the current member.
                                var lastread = "";

                                element.members.forEach(function (member) {

                                    if (member.userid === data.get.userid) {

                                        if (member.lastviewed) {
                                            lastread = member.lastviewed;
                                        } else {
                                            lastread = '0';
                                        }

                                    }

                                });

                                groups.push(element._id);
                                groupactivity[element._id] = lastread;

                            });

                            //Loop over the last read times to find the earliest time so the database doesn't have to pull too many messages in

                            var earliestmessage = Date.now();

                            groups.forEach(function (element) {

                                if (groupactivity[element] < earliestmessage) {

                                    earliestmessage = groupactivity[element];

                                }

                            });

                            query._id = {
                                $gt: exports.objectIDWithTimestamp(earliestmessage)
                            };

                            //Don't load user's own messages

                            query.userid = {
                                $ne: data.get.userid
                            };

                            //Only load messages from the groups the user is part of

                            query.groupid = {
                                $in: groups
                            };

                            process.hook('hook_db_find', {
                                dbcollection: 'messages',
                                dbquery: query
                            }, function (gotData) {

                                if (gotData.returns !== '[]') {

                                    var messages = JSON.parse(gotData.returns),
                                        unreadbundle = {};
                                    data.returns = {};

                                    //Loop over all returned messages and create a message counter for each group

                                    messages.forEach(function (element) {

                                        //Only add the message if it was received after the group was last checked

                                        var messagedate = objectID(element._id).getTimestamp(),
                                            groupviewed = new Date(groupactivity[element.groupid]);

                                        if (messagedate > groupviewed) {

                                            //Create bundle of unread messages for if user requests all of them

                                            if (data.get.messages) {

                                                if (!unreadbundle[element.groupid]) {

                                                    unreadbundle[element.groupid] = {
                                                        groupid: element.groupid,
                                                        messages: []
                                                    };

                                                }

                                                unreadbundle[element.groupid].messages.push(element);

                                            }


                                            if (!data.returns[element.groupid]) {
                                                data.returns[element.groupid] = 1;
                                            } else {
                                                data.returns[element.groupid] += 1;
                                            }

                                        }

                                    });

                                    if (data.get.messages) {

                                        //Make pretty message feed for humans

                                        var groups = Object.keys(unreadbundle);

                                        groups.forEach(function (element, index) {

                                            groups[index] = objectID(element);

                                        });

                                        var query = {};

                                        query._id = {
                                            $in: groups
                                        };

                                        process.hook('hook_db_find', {
                                            dbcollection: 'groups',
                                            dbquery: query
                                        }, function (gotData) {

                                            var group;

                                            for (group in unreadbundle) {

                                                JSON.parse(gotData.returns).forEach(function (element, index) {

                                                    if (element._id = group) {

                                                        unreadbundle[group].details = element;

                                                        unreadbundle[group].members = [];

                                                        element.members.forEach(function (user, index) {

                                                            unreadbundle[group].members.push(process.usercache[user.userid]);

                                                        });

                                                    }

                                                });

                                            };

                                            data.returns = JSON.stringify(unreadbundle);
                                            process.emit('next', data);
                                        });

                                    } else {

                                        data.returns = JSON.stringify(data.returns);
                                        process.emit('next', data);

                                    }


                                } else {

                                    data.returns = "0";
                                    process.emit('next', data);


                                }

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
            var query = {
                groupid: data.groupid
            };
            if (data.since) {
                query._id = {
                    $gt: exports.objectIDWithTimestamp(data.since)
                };
            }

            process.hook('hook_db_find', {
                dbcollection: 'messages',
                dbquery: query
            }, function (gotData) {

                var messages = JSON.parse(gotData.returns);

                messages.forEach(function (element, index) {

                    var message = messages[index];

                    if(process.usercache[message.userid]){
                    message.username = process.usercache[message.userid].username;
                    }
                    
                });

                data.returns = JSON.stringify(messages);
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

                process.hook('hook_auth_check', {
                    userid: data.get.userid,
                    token: data.get.token
                }, function (authorised) {
                    if (authorised.returns === true) {
                        var query = {
                            groupid: data.get.groupid
                        };

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
                process.hook('hook_auth_check', {
                    userid: data.get.userid,
                    token: data.get.token
                }, function (authorised) {
                    if (authorised.returns === true) {
                        process.hook('hook_groupid_from_messageid', {
                            messageid: data.get.messageid
                        }, function (groupid) {
                            if (groupid.returns) {
                                process.hook('hook_db_find', {
                                    dbcollection: 'groups',
                                    dbquery: {
                                        '_id': objectID(groupid.returns),
                                        members: {
                                            $elemMatch: {
                                                'userid': data.get.userid
                                            }
                                        }
                                    }
                                }, function (groupinfo) {
                                    if (groupinfo.returns && groupinfo.returns !== '[]') {

                                        process.hook('hook_db_find', {
                                            dbcollection: 'messages',
                                            dbquery: {
                                                '_id': objectID(data.get.messageid)
                                            }
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