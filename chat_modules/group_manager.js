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
 *  /fetch/groups
 *  /debug/groups
 *  /group/add
 *  /group/update/addmember
 *  /group/update/removemember
 *  /group/update/name
 */

//var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

var exports = {
    options: { allowdebug: false },
    // TODO: this module needs refactoring methinks. but hey, it does work.
    hook_group_list_users: {
        rank: 0,
        event:
            function (data) {

                if (objectID.isValid(data.groupid)) {
                    var groupid = data.groupid,
                        userid = data.userid, // optional: don't return results that don't include this user
                        query = {'_id': objectID(groupid)};

                    if (userid) {
                        query = {'_id': objectID(groupid), members: {$elemMatch: {'userid': data.userid.toString()}}};
                    }

                    process.hook('hook_db_find',
                        {
                            dbcollection: 'groups',
                            dbquery: query
                        },
                        function (gotData) {
                            if (gotData.returns && JSON.parse(gotData.returns)[0]) {
                                data.returns = JSON.parse(gotData.returns)[0].members;
                                process.emit('next', data);
                            } else {
                                console.log("[INFO] hook_group_list_users: Request for nonexistent or inaccessible group ID");
                                data.returns = false;
                                process.emit('next', data);
                            }
                        });
                } else {
                    console.log("[INFO] hook_group_list_users: Request for bad ObjectID");
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
                process.hook('hook_auth_check', {userid: data.get.userid, token: data.get.token}, function (gotData) {
                    if (gotData.returns === true) {
                        var groupid = data.get.groupid;

                        if (objectID.isValid(data.get.groupid)) {
                            process.hook('hook_group_list_users',
                                {
                                    'groupid': groupid,
                                    'userid': data.get.userid
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
                    } else {
                        data.returns = "ERROR: Authentication failed.";
                        process.emit('next', data);
                    }
                });
            }
    },
    // POST /group/add
    hook_post_group_add: {
        rank: 0,
        event:
            function (data) {
                // userid, token, name, members[], is121
                var url = data.url,
                    post = data.post,
                    groupMembers = [],
                    groupMembersValid = true,
                    is121 = false,
                    currentDate = Date.now(),
                    memberObjects = [];

                // read only (i.e. CMS controlled) group?
                if (data.post.readonly === 'true' && data.post.secretkey) {
                    process.hook('hook_secretkey_check', {secretkey: data.post.secretkey}, function (valid) {
                        if (valid.returns === true) {
                            // Secret key OK.

                            // Call database insert hook to insert the new group object
                            process.hook('hook_db_insert', {
                                dbcollection: 'groups',
                                dbobject: {'members': data.post.members, 'name': data.post.name, 'isReadOnly': true}
                            }, function (gotData) {
                                data.returns = JSON.stringify(gotData.returns[0]._id).replace(/"/g, ""); // unescape extra quotes
                                process.emit('next', data);
                            });
                        } else {
                            data.returns = "ERROR: Secret key incorrect";
                            process.emit('next', data);
                        }
                    });
                } else {
                    // User controlled group
                    process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {
                        if (gotData.returns === true) {
                            // Validate POSTed data
                            if (post.members) {
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

                                // Make sure is121 is sane
                                if (post.is121 === 'true') {
                                    is121 = true;
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

                                // if group is one-to-one, check if one like that already exists
                                if (is121 === true) {
                                    // Check number of members
                                    if (memberObjects.length === 2) {
                                        // Search database for existing 121 chat with those members
                                        process.hook('hook_db_find', {
                                            dbcollection: 'groups',
                                            dbquery: {'is121': true, $and: [{'members': {$elemMatch: {'userid': groupMembers[0]}}}, {'members': {$elemMatch: {'userid': groupMembers[1]}}}]}
                                        }, function (result) {
                                            if (result.returns && JSON.parse(result.returns).length === 0) {
                                                // Call database insert hook to insert the new group object
                                                process.hook('hook_db_insert', {
                                                    dbcollection: 'groups',
                                                    dbobject: {'members': memberObjects, 'name': post.name, is121: true, 'isReadOnly': false}
                                                }, function (gotData) {
                                                    data.returns = JSON.stringify(gotData.returns[0]._id).replace(/"/g, ""); // unescape extra quotes
                                                    process.emit('next', data);
                                                });
                                            } else {
                                                data.returns = 'ERROR: One-to-one chat containing these members already exists.';
                                                process.emit('next', data);
                                            }
                                        });
                                    } else {
                                        data.returns = 'ERROR: One-to-one chat can ony contain two members.';
                                        process.emit('next', data);
                                    }
                                } else {
                                    // Insert normally

                                    // Call database insert hook to insert the new group object
                                    process.hook('hook_db_insert', {
                                        dbcollection: 'groups',
                                        dbobject: {'members': memberObjects, 'name': post.name, 'isReadOnly': false}
                                    }, function (gotData) {
                                        data.returns = JSON.stringify(gotData.returns[0]._id).replace(/"/g, ""); // unescape extra quotes
                                        process.emit('next', data);
                                    });
                                }
                            } else {
                                data.returns = "ERROR: No initial members specified.";
                                process.emit('next', data);
                            }
                        } else {
                            data.returns = "ERROR: Authentication failed.";
                            process.emit('next', data);
                        }
                    });
                }
            }
    },
    // GET /debug/groups
    hook_get_debug_groups: {
        rank: 0,
        event:
            function (data) {
                if (exports.options && exports.options.allowdebug) {
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
                } else {
                    data.returns = 'ERROR: Feature disabled.';
                    process.emit('next', data);
                }

            }
    },
    // GET /fetch/groups
    hook_get_fetch_groups: {
        rank: 0,
        event:
            function (data) {
                if (data.get.userid && data.get.token) {
                    process.hook('hook_auth_check', {userid: data.get.userid, token: data.get.token}, function (gotData) {
                        if (gotData.returns === true) {

                            // Call db find hook.
                            process.hook('hook_db_find', {
                                dbcollection: 'groups',
                                dbquery: {members: {$elemMatch: {'userid': data.get.userid.toString()}}},
                                dboptions: {"sort": [['lastupdated', 'desc'], ['joined', 'desc']]}
                            }, function (gotData) {
                                data.returns = gotData.returns;
                                console.log(gotData.returns);
                                process.nextTick(function () {
                                    process.emit('next', data);
                                });
                            });

                        } else {
                            data.returns = "ERROR: Authentication failed.";
                            process.emit('next', data);
                        }
                    });
                } else {
                    data.returns = "ERROR: Missing userid or token.";
                    process.emit('next', data);
                }
            }
    },
    hook_fetch_groups: {
        rank: 0,
        event:
            function (data) {
                if (data.userid && data.token) {
                    process.hook('hook_auth_check', {userid: data.userid, token: data.token}, function (gotData) {
                        if (gotData.returns === true) {

                            // Call db find hook.
                            process.hook('hook_db_find', {
                                dbcollection: 'groups',
                                dbquery: {members: {$elemMatch: {'userid': data.userid.toString()}}}
                            }, function (gotData) {
                                data.returns = gotData.returns;
                                process.nextTick(function () {
                                    process.emit('next', data);
                                });
                            });

                        } else {
                            data.returns = "ERROR: Authentication failed.";
                            process.emit('next', data);
                        }
                    });
                } else {
                    data.returns = "ERROR: Missing userid or token.";
                    process.emit('next', data);
                }
            }
    },
    
    hook_group_update: {
        rank: 0,
        event:
            function (data) {

                var query;
                if (data.userid) {
                    query = {'_id': objectID(data.groupid), 'isReadOnly': false, members: {$elemMatch: {'userid': data.userid.toString()}}};
//                    console.log(query);
                } else {
                    query = {'_id': objectID(data.groupid)};
                }

                if (data.action === 'addmember') {

                    console.log('adding member');
                    process.hook('hook_db_update', {
                        dbcollection: 'groups',
                        dbquery: query,
                        dbupdate: {$push: {members: {'userid': data.members, 'joined': Date.now()}}},
                        dbmulti: true,
                        dbupsert: false
                    }, function (gotData) {
                        console.log('db update returns');
                        data.returns = gotData.returns;
                        process.emit('next', data);
                    });

                } else if (data.action === 'removemember') {
                    process.hook('hook_db_update', {
                        dbcollection: 'groups',
                        dbquery: query,
                        dbupdate: {$pull: {members: {'userid': data.members}}},
                        dbmulti: true,
                        dbupsert: false
                    }, function (gotData) {
                        data.returns = gotData.returns;
                        process.emit('next', data);
                    });

                } else if (data.action === 'name') {
                    process.hook('hook_db_update', {
                        dbcollection: 'groups',
                        dbquery: query,
                        dbupdate: {$set: {name: data.name}},
                        dbmulti: false,
                        dbupsert: false
                    }, function (gotData) {
                        data.returns = gotData.returns;
                        process.emit('next', data);
                    });

                } else {
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

                if (data.post.members && data.post.groupid) {

                    if (data.post.secretkey) {
                        process.hook('hook_secretkey_check', {secretkey: data.post.secretkey}, function (valid) {
                            if (valid.returns === true) {

                                process.hook('hook_group_update', {
                                    action: 'addmember',
                                    userid: data.post.userid,
                                    members: data.post.members,
                                    groupid: data.post.groupid
                                }, function (gotData) {
                                    data.returns = gotData.returns;
                                    process.emit('next', data);
                                });

                            } else {
                                data.returns = "ERROR: Secret key incorrect";
                                process.emit('next', data);
                            }
                        });
                    } else {
                        process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {
                            if (gotData.returns === true) {

                                console.log('Running update hook');

                                process.hook('hook_group_update', {
                                    action: 'addmember',
                                    userid: data.post.userid,
                                    members: data.post.members,
                                    groupid: data.post.groupid
                                }, function (gotData) {
                                    console.log("group update returns.");
                                    data.returns = gotData.returns;
                                    process.emit('next', data);
                                });

                            } else {
                                data.returns = "ERROR: Authentication failed.";
                                process.emit('next', data);
                            }
                        });
                    }
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

                if (data.post.members && data.post.groupid) {

                    if (data.post.secretkey) {
                        process.hook('hook_secretkey_check', {secretkey: data.secretkey}, function (valid) {
                            if (valid.returns === true) {

                                process.hook('hook_group_update', {
                                    action: 'removemember',
                                    members: data.post.members,
                                    userid: data.post.userid,
                                    groupid: data.post.groupid
                                }, function (gotData) {
                                    data.returns = gotData.returns;
                                    process.emit('next', data);
                                });

                            } else {
                                data.returns = "ERROR: Secret key incorrect";
                                process.emit('next', data);
                            }
                        });
                    } else {
                        process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {
                            if (gotData.returns === true) {

                                process.hook('hook_group_update', {
                                    action: 'removemember',
                                    members: data.post.members,
                                    userid: data.post.userid,
                                    groupid: data.post.groupid
                                }, function (gotData) {
                                    data.returns = gotData.returns;
                                    process.emit('next', data);
                                });

                            } else {
                                data.returns = "ERROR: Authentication failed.";
                                process.emit('next', data);
                            }
                        });
                    }
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

                if (data.post.name && data.post.groupid) {

                    if (data.post.secretkey) {
                        process.hook('hook_secretkey_check', {secretkey: data.secretkey}, function (valid) {
                            if (valid.returns === true) {

                                process.hook('hook_group_update', {
                                    action: 'name',
                                    name: data.post.name,
                                    groupid: data.post.groupid,
                                    userid: data.post.userid
                                }, function (gotData) {
                                    data.returns = gotData.returns;
                                    process.emit('next', data);
                                });

                            } else {
                                data.returns = "ERROR: Secret key incorrect";
                                process.emit('next', data);
                            }
                        });
                    } else {
                        process.hook('hook_auth_check', {userid: data.post.userid, token: data.post.token}, function (gotData) {
                            if (gotData.returns === true) {

                                process.hook('hook_group_update', {
                                    action: 'name',
                                    name: data.post.name,
                                    groupid: data.post.groupid,
                                    userid: data.post.userid
                                }, function (gotData) {
                                    data.returns = gotData.returns;
                                    process.emit('next', data);
                                });

                            } else {
                                data.returns = "ERROR: Authentication failed.";
                                process.emit('next', data);
                            }
                        });
                    }

                } else {
                    data.returns = "ERROR: Invalid new name or groupid.";
                    process.emit('next', data);
                }
            }
    },
    hook_groupid_from_messageid: {
        rank: 0,
        event: function (data) {
            var messageid = objectID(data.messageid);

            process.hook('hook_db_find', {
                dbcollection: 'messages',
                dbquery: {'_id': messageid}
            }, function (gotData) {
                try {
                    data.returns = JSON.parse(gotData.returns)[0].groupid;
                } catch (err) {
                    console.log('invalid messageid?');
                }
                process.emit('next', data);
            });
        }
    }
};

module.exports = exports;
