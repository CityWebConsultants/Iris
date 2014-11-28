/*jslint node: true nomen: true*/
"use strict";

/*  Group Manager Module
 *
 *  Provides an essential group management system. Provides hooks for creating and editing groups.
 *  All user interactions take place in the context of a group.
 *
 *  Core hooks:
 *  hook_group_list_users
 *  hook_group_update
 *
 *  API endpoints:
 *  /fetch/group/users
 *  /debug/groups
 *  /group/add
 *  /group/update/addmember
 *  /group/update/name
 */

// TODO: check if users to add already exist in group
// TODO: one-to-one chat continuation, Skype style

//var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

var exports = {
    options: {},
    // TODO: Separate out core functions here as their own hooks to reduce duplication.
    hook_group_list_users: {
        rank: 0,
        event:
            function (data) {
                var groupid = data.groupid;

                if (objectID.isValid(data.groupid)) {
                    process.hook('hook_db_find',
                        {
                            dbcollection: 'groups',
                            dbquery: {'_id': objectID(groupid)}
                        },
                        function (gotData) {
                            if (gotData.returns && JSON.parse(gotData.returns)[0]) {
                                data.returns = JSON.parse(gotData.returns)[0].members;
                                process.emit('next', data);
                            } else {
                                data.returns = "ERROR: Nonexistent group ID.";
                                process.emit('next', data);
                            }
                        });
                } else {
                    data.returns = false;
                    process.emit('next', data);
                }
            }
    },
    // GET /fetch/group/users
    hook_get_fetch_group_users: {
        rank: 0,
        event:
            function (data) {
                var groupid = data.get.groupid;

                if (objectID.isValid(data.get.groupid)) {
                    process.hook('hook_group_list_users',
                        {
                            'groupid': groupid
                        },
                        function (gotData) {
                            if (typeof gotData.returns !== 'string') {
                                data.returns = JSON.stringify(gotData.returns);
                            } else {
                                data.returns = gotData.returns;
                            }
                            process.emit('next', data);
                        });
                } else {
                    data.returns = "ERROR: Invalid group ID.";
                    process.emit('next', data);
                }
            }
    },
    // POST /group/add
    hook_post_group_add: {
        rank: 0,
        event:
            function (data) {
                var url = data.url,
                    post = data.post,
                    groupMembers = [],
                    groupMembersValid = true,
                    currentDate = Date.now(),
                    memberObjects = [];

                // Validate POSTed data

                // Force it to be an array
                if (post.members.constructor && post.members.constructor !== Array) {
                    groupMembers[0] = post.members;
                } else {
                    groupMembers = post.members;
                }

                // Foreach item, check for a numeric userid (could make this configurable as to what is a valid userid)
                groupMembers.forEach(function (element, index) {
                    if (isNaN(element) || element === '') {
                        groupMembersValid = false;
                    }
                });

                // If no name supplied, make sure it's blank.
                if (!post.name) {
                    post.name = '';
                }

                // If invalid, return fail
                if (groupMembersValid !== true) {
                    data.returns = 'ERROR: Invalid user id(s)';
                    // Pass on to the next handler in case it can still salvage this :)
                    process.emit('next', data);
                    return;
                }

                groupMembers.forEach(function (element, index) {
                    memberObjects.push({userid: element, joined: currentDate});
                });

                // Call database insert hook to insert the new group object
                process.hook('hook_db_insert', {dbcollection: 'groups', dbobject: {'members': memberObjects, 'name': post.name}}, function (gotData) {
                    data.returns = JSON.stringify(gotData.returns[0]._id).replace(/"/g, ""); // it gets too many quotes from all the stringifying
                    process.emit('next', data);
                });
            }
    },
    // GET /debug/groups
    hook_get_debug_groups: {
        rank: 0,
        event:
            function (data) {
                var get = data.get,
                    query = {};

                if (get.userid) {
                    query = {members: {$elemMatch: {'userid': get.userid.toString()}}};
                }
                
                // Call db find hook.
                process.hook('hook_db_find',
                    {
                        dbcollection: 'groups',
                        dbquery: query,
                        callback: function (gotData) {
                            data.returns = gotData.returns;
                            process.nextTick(function () {
                                process.emit('next', data);
                            });
                        }
                    });
            }
    },
    hook_group_update: {
        rank: 0,
        event:
            function (data) {

                switch (data.action) {
                case 'addmember':
                    process.hook('hook_db_update',
                        {
                            dbcollection: 'groups',
                            dbquery: {'_id': objectID(data.groupid)},
                            dbupdate: {$push: {members: {'userid': data.userid, 'joined': Date.now()}}},
                            dbmulti: true,
                            dbupsert: false
                        }, function (gotData) {
                            data.returns = gotData.returns;
                            process.emit('next', data);
                        });
                    break;
                case 'removemember':
                    process.hook('hook_db_update',
                        {
                            dbcollection: 'groups',
                            dbquery: {'_id': objectID(data.groupid)},
                            dbupdate: {$pull: {members: {'userid': data.userid}}},
                            dbmulti: true,
                            dbupsert: false
                        }, function (gotData) {
                            data.returns = gotData.returns;
                            process.emit('next', data);
                        });
                    break;
                case 'name':
                    process.hook('hook_db_update',
                        {
                            dbcollection: 'groups',
                            dbquery: {'_id': objectID(data.groupid)},
                            dbupdate: {$set: {name: data.name}},
                            dbmulti: false,
                            dbupsert: false
                        }, function (gotData) {
                            data.returns = gotData.returns;
                            process.emit('next', data);
                        });
                    break;
                default:
                    data.returns = false;
                    process.emit('next', data);
                }
            }
    },
    // POST /group/update/addmember
    hook_post_group_update_addmember: {
        rank: 0,
        event:
            function (data) {
                var post = data.post;

                if (post.userid && post.groupid) {
                    process.hook('hook_group_update', {action: 'addmember', userid: post.userid, groupid: post.groupid}, function (gotData) {
                        data.returns = gotData.returns;
                        process.emit('next', data);
                    });
                } else {
                    data.returns = "ERROR: Invalid userid or groupid.";
                    process.emit('next', data);
                }
            }
    },
    // POST /group/update/removemember
    hook_post_group_update_removemember: {
        rank: 0,
        event:
            function (data) {
                var post = data.post;

                if (post.userid && post.groupid) {
                    process.hook('hook_group_update', {action: 'removemember', userid: post.userid, groupid: post.groupid}, function (gotData) {
                        data.returns = gotData.returns;
                        process.emit('next', data);
                    });
                } else {
                    data.returns = "ERROR: Invalid userid or groupid.";
                    process.emit('next', data);
                }
            }
    },
    // POST /group/update/name
    hook_post_group_update_name: {
        rank: 0,
        event:
            function (data) {
                var post = data.post;

                if (post.name && post.groupid) {
                    process.hook('hook_group_update', {action: 'name', name: post.name, groupid: post.groupid}, function (gotData) {
                        data.returns = gotData.returns;
                        process.emit('next', data);
                    });
                } else {
                    data.returns = "ERROR: Invalid new name or groupid.";
                    process.emit('next', data);
                }
            }
    }
};

module.exports = exports;
