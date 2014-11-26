/*jslint node: true */
"use strict";
var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

var exports = {
    options: {},
    // TODO: Separate out core functions here as their own hooks to reduce duplication.
    hook_group_list_users: {
        rank: 0,
        event:
            function (data) {
                var groupid = data.groupid;

                process.hook('hook_db_find',
                    {
                        dbcollection: 'groups',
                        dbquery: {'_id': objectID(groupid)}
                    },
                    function (gotData) {
                        data.returns = JSON.parse(gotData.results)[0].members;
                        process.emit('next', data);
                    });
            }
    },
    // GET /fetch/group/users
    hook_get_fetch_group_users: {
        rank: 0,
        event:
            function (data) {
                var groupid = data.get.groupid;

                process.hook('hook_group_list_users',
                    {
                        'groupid': groupid
                    },
                    function (gotData) {
                        console.log(gotData.users);
                        data.returns = JSON.stringify(gotData.returns);
                        process.emit('next', data);
                    });
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
                if (post.members.constructor !== Array) {
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

                // If no name supplied, make it blank.
                if (!post.name) {
                    post.name = '';
                }

                // If invalid, return fail
                if (groupMembersValid !== true) {
                    data.returns = 'invalid user id(s)';
                    // Pass on to the next handler in case it can still salvage this :)
                    process.emit("next", data);
                    return;
                }

                groupMembers.forEach(function (element, index) {
                    memberObjects.push({userid: element, joined: currentDate});
                });

                // Call database insert hook to insert the new group object
                process.hook('hook_db_insert', {dbcollection: 'groups', dbobject: {'members': memberObjects, 'name': post.name}});
                data.returns = 'Insertion successful.';
                process.emit("next", data);
            }
    },
    // GET /fetch/group
    hook_get_fetch_group: {
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
                            data.returns = gotData.results;
                            console.log('r:' + data.returns);
                            process.nextTick(function () {
                                process.emit("next", data);
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
                            data.returns = gotData.results;
                            process.emit("next", data);
                        });
                    break;
                case 'removemember':

                    break;
                case 'name':

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
                var post = data.post,
                    query = {};

                if (post.userid && post.groupid) {
                    process.hook('hook_group_update', {action: 'addmember', userid: post.userid, groupid: post.groupid}, function (gotData) {
                        data.returns = gotData.returns;
                        process.emit("next", data);
                    });
                } else {
                    data.returns("Missing userid or groupid.");
                    process.emit("next", data);
                }
            }
    }
};

module.exports = exports;
