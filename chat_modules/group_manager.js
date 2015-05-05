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

//Translate default name to list of users (not including current user)

var defaultname = function (members, userid) {

    var name = "";

    if (members.length > 1) {
        members.forEach(function (element, index) {

            if(element.uid){

             element.userid = element.uid;

            }

            if (process.usercache[element.userid] && element.userid !== userid) {

                name += process.usercache[element.userid].username;
                name += ", ";

            }

        });

        // Trim last comma from the end.
        name = name.slice(0, -2);

    } else {
        if (process.usercache[userid]) {
            name = process.usercache[userid].username;
        }
    }

    return name;

};

process.defaultname = defaultname;

var getavatar = function (group, userid) {

    if (group.is121) {
        var avatar;
        group.members.forEach(function (element, index) {
            if (element.userid != userid) {
                if (process.usercache[element.userid] && process.usercache[element.userid].avatar) {
                    avatar = process.usercache[element.userid].avatar;
                }
            }
        });

        if (!avatar) {
            avatar = null;
        }

        return avatar;
    } else if (group.isReadOnly) {
        var avatar;
        if (group.avatar) {
            avatar = group.avatar;
        } else {
            avatar = null;
        }

        return avatar;
    } else {
        return null;
    }
}

var exports = {
    options: {
        allowdebug: false
    },
    // TODO: this module needs refactoring methinks. but hey, it does work.
    hook_get_fetch_group: {
        rank: 0,
        event: function (data) {
            process.hook('hook_fetch_group', {
                userid: data.get.userid,
                token: data.get.token,
                groupid: data.get.groupid
            }, function (gotData) {
                data.returns = JSON.stringify(gotData.returns);
                process.emit('next', data);
            });
        }
    },
    hook_fetch_group: {
        rank: 0,
        event: function (data) {
            if (data.userid && data.token && data.groupid) {
                try {
                    data.groupid = objectID(data.groupid);
                } catch (e) {
                    data.returns = "ERROR: Bad ObjectID";
                    process.emit("next", data);
                    return false;
                }

                process.hook('hook_auth_check', {
                    userid: data.userid,
                    token: data.token
                }, function (gotData) {
                    if (gotData.returns === true) {

                        // Call db find hook.
                        process.hook('hook_db_find', {
                            dbcollection: 'groups',
                            dbquery: {
                                members: {
                                    $elemMatch: {
                                        'userid': data.userid
                                    }
                                },
                                '_id': data.groupid
                            }
                        }, function (gotData) {

                            var groupdata = JSON.parse(gotData.returns);

                            groupdata.forEach(function (element, index) {
                                if (element.name === 'default') {
                                    groupdata[index].name = defaultname(element.members, data.userid);
                                }

                                groupdata[index].avatar = getavatar(element, data.userid);
                            });

                            data.returns = groupdata;

                            process.emit('next', data);
                        });

                    } else {
                        data.returns = "ERROR: Authentication failed.";
                        process.emit('next', data);
                    }
                });
            } else {
                data.returns = "ERROR: Missing userid, token or groupid.";
                process.emit('next', data);
            }
        }
    },
    hook_group_list_users: {
        rank: 0,
        event: function (data) {

            if (objectID.isValid(data.groupid)) {
                var groupid = data.groupid,
                    userid = data.userid, // optional: don't return results that don't include this user
                    query = {
                        '_id': objectID(groupid)
                    };

                if (userid) {
                    query = {
                        '_id': objectID(groupid),
                        members: {
                            $elemMatch: {
                                'userid': data.userid.toString()
                            }
                        }
                    };
                }

                process.hook('hook_db_find', {
                        dbcollection: 'groups',
                        dbquery: query
                    },
                    function (gotData) {
                        if (gotData.returns && JSON.parse(gotData.returns)[0]) {
                            data.returns = JSON.parse(gotData.returns)[0].members;

                            data.returns.forEach(function (element, index) {

                                var property;

                                for (property in process.usercache[element.userid]) {


                                    data.returns[index][property] = process.usercache[element.userid][property];


                                }
                            });

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
        event: function (data) {
            process.hook('hook_auth_check', {
                userid: data.get.userid,
                token: data.get.token
            }, function (gotData) {
                if (gotData.returns === true) {
                    var groupid = data.get.groupid;

                    if (objectID.isValid(data.get.groupid)) {
                        process.hook('hook_group_list_users', {
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
        event: function (data) {
            // userid, token, name, members[], is121

            var groupdata = {};

            var addgroup = function (group) {
                process.hook("hook_group_add", group, function (groupid) {
                    // check success
                    if (groupid.success) {
                        data.returns = groupid.returns.toString();
                    } else {
                        data.returns = "ERROR: Could not add group although the request was valid.";
                    }
                    process.emit("next", data);
                });
            };

            // Read only / CMS
            if (data.post.readonly === 'true' && data.post.apikey && data.post.secretkey) {
                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (valid) {
                    if (valid.returns === true) {

                        if (data.post.members.constructor && data.post.members.constructor !== Array) {
                            data.post.members = [data.post.members];
                        }

                        // Avoid awkward null
                        if (!data.post.members) {
                            data.post.members = [];
                        }

                        var groupObject = {};

                        groupObject.name = data.post.name;
                        groupObject.members = data.post.members;
                        groupObject.isReadOnly = true;
                        groupObject.reftype = data.post.reftype;

                        if (data.post.reftype === 'og') {
                            groupObject.entityref = data.post.entityref;
                        } else if (data.post.reftype === 'event') {
                            groupObject.entityref = data.post.entityref;
                            groupObject.starttime = data.post.starttime;
                            groupObject.endtime = data.post.endtime;
                        }

                        // Add group
                        addgroup(groupObject);

                    } else {
                        data.returns = "ERROR: Secret key incorrect";
                        process.emit('next', data);
                    }
                });
                // User controlled
            } else {
                process.hook('hook_auth_check', {
                    userid: data.post.userid,
                    token: data.post.token
                }, function (gotData) {
                    if (gotData.returns === true) {
                        // Check for valid members
                        if (data.post.members && data.post.members.constructor && data.post.members.constructor === Array && data.post.members.length > 1) {

                            // Check if it contains its creator
                            var containsCreator = false;

                            data.post.members.forEach(function (element, index) {
                                if (element === data.post.userid) {
                                    containsCreator = true;
                                }
                            });

                            var groupMembersValid = true;
                            if (containsCreator === false) {
                                groupMembersValid = false;
                            }

                            // If no name supplied, make sure it's blank.
                            if (!data.post.name) {
                                data.post.name = '';
                            }

                            // Make sure is121 is sane
                            if (data.post.is121 === 'true') {
                                data.post.is121 = true;
                            }

                            // If invalid, return fail
                            if (groupMembersValid !== true) {
                                data.returns = 'ERROR: Group does not contain its creator.';
                                process.emit('next', data);
                                return;
                            }

                            // if group is one-to-one, check if one like that already exists
                            if (data.post.is121 === true) {
                                // Search database for existing 121 chat with those members
                                process.hook('hook_db_find', {
                                    dbcollection: 'groups',
                                    dbquery: {
                                        'is121': true,
                                        $and: [{
                                            'members': {
                                                $elemMatch: {
                                                    'userid': data.post.members[0]
                                                }
                                            }
                                        }, {
                                            'members': {
                                                $elemMatch: {
                                                    'userid': data.post.members[1]
                                                }
                                            }
                                        }]
                                    }
                                }, function (result) {
                                    if (result.returns && JSON.parse(result.returns).length === 0) {

                                        addgroup({
                                            name: data.post.name,
                                            members: data.post.members,
                                            is121: true
                                        });

                                    } else {
                                        data.returns = 'ERROR: One-to-one chat containing these members already exists.';
                                        process.emit('next', data);
                                    }
                                });
                                // If not 121, just add it
                            } else {

                                addgroup({
                                    name: data.post.name,
                                    members: data.post.members
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
    hook_group_add: {
        rank: 0,
        event: function (data) {
            // readonly? is121?
            // members[], name

            // Should check for duplicate members
            // Should allow only two users in a 121 group
            // Should allow creation of any groups within rules (i.e. no creator check)

            var ok = true;
            data.success = false;

            if (data.members && data.name) {

                // Remove duplicate users
                data.members = data.members.filter(function (v, i, a) {
                    return a.indexOf(v) === i;
                });

                // Build base query
                var query = {
                        name: data.name,
                        members: []
                    },
                    members = [],
                    currentDate = Date.now();

                data.members.forEach(function (element, index) {
                    query.members.push({
                        userid: element,
                        joined: currentDate
                    });
                });

                // Set readonly or 121 flags; check if 121 group has two members
                query.isReadOnly = false;

                if (data.isReadOnly) {
                    query.isReadOnly = true;
                } else if (data.is121) {
                    query.is121 = true;

                    if (data.members.length > 2) {
                        data.ok = false;
                    }
                }

                if (data.reftype) {
                    query.reftype = data.reftype;
                }

                // Group reference and info
                if (data.reftype === 'og') {
                    query.entityref = data.entityref;
                }

                // Event reference and info
                if (data.reftype === 'event') {
                    query.entityref = data.entityref;
                    query.starttime = data.starttime;
                    query.endtime = data.endtime;
                }

                query.lastupdated = Date.now();

                // If things are in order, insert!
                if (ok === true) {

                    process.hook('hook_db_insert', {
                        dbcollection: 'groups',
                        dbobject: query
                    }, function (gotData) {
                        data.returns = gotData.returns[0]._id;
                        data.success = true;
                        process.emit('next', data);
                    });

                } else {
                    data.success = false;
                    data.error = "bad_request";
                    process.emit('next', data);
                }

            } else {
                data.success = false;
                data.error = "bad_request";
                process.emit('next', data);
            }
        }
    },
    // GET /debug/groups
    hook_get_debug_groups: {
        rank: 0,
        event: function (data) {
            if (exports.options && exports.options.allowdebug) {
                var get = data.get,
                    query = {};

                if (get.userid) {
                    query = {
                        members: {
                            $elemMatch: {
                                'userid': get.userid.toString()
                            }
                        }
                    };
                }

                // Call db find hook.
                process.hook('hook_db_find', {
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
        event: function (data) {
            if (data.get.userid && data.get.token) {

                process.hook('hook_auth_check', {
                    userid: data.get.userid,
                    token: data.get.token
                }, function (auth) {
                    if (auth.returns === true) {
                        process.hook('hook_fetch_groups', {
                            userid: data.get.userid
                        }, function (groups) {
                            data.returns = groups.returns;
                            process.emit('next', data);
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
        event: function (data) {
            if (data.userid) {

                // Call db find hook.
                process.hook('hook_db_find', {
                    dbcollection: 'groups',
                    dbquery: {
                        members: {
                            $elemMatch: {
                                'userid': data.userid
                            }
                        }
                    }
                }, function (gotData) {
                    var groupdata = JSON.parse(gotData.returns);

                    groupdata.forEach(function (element, index) {
                        if (element.name === 'default') {
                            groupdata[index].name = defaultname(element.members, data.userid);
                        }

                        groupdata[index].avatar = getavatar(element, data.userid);
                    });

                    data.returns = JSON.stringify(groupdata);

                    process.emit('next', data);
                });

            }
        }
    },
    hook_group_update: {
        rank: 0,
        event: function (data) {

            var query;
            if (data.userid) {
                query = {
                    '_id': objectID(data.groupid),
                    'isReadOnly': false,
                    $or: [{
                        'is121': false
                    }, {
                        'is121': {
                            $exists: false
                        }
                    }],
                    members: {
                        $elemMatch: {
                            'userid': data.userid.toString()
                        }
                    }
                };
            } else {
                query = {
                    '_id': objectID(data.groupid)
                };
                data.userid = 0;
            }

            if (data.action === 'addmember') {

                process.hook('hook_db_find', {
                    dbcollection: 'groups',
                    dbquery: {
                        '_id': objectID(data.groupid),
                        members: {
                            $elemMatch: {
                                'userid': data.members
                            }
                        }
                    }
                }, function (existing) {

                    // If this user doesn't yet exist
                    if (existing.returns && existing.returns === '[]') {

                        process.hook('hook_db_update', {
                            dbcollection: 'groups',
                            dbquery: query,
                            dbupdate: {
                                $push: {
                                    members: {
                                        'userid': data.members,
                                        'joined': Date.now()
                                    }
                                }
                            },
                            dbmulti: true,
                            dbupsert: false
                        }, function (gotData) {
                            data.returns = gotData.returns;

                            // Put a message into the group directly

                            process.hook("hook_send_joined_message", {
                                userid: data.userid,
                                members: data.members,
                                groupid: data.groupid
                            }, function (gotData) {
                                process.emit("next", data);
                            });

                        });

                    } else {
                        data.returns = 'ERROR: That user is already present in the group.';
                        process.emit('next', data);
                    }

                });

            } else if (data.action === 'removemember') {

                process.hook('hook_db_update', {
                    dbcollection: 'groups',
                    dbquery: query,
                    dbupdate: {
                        $pull: {
                            members: {
                                'userid': data.members
                            }
                        }
                    },
                    dbmulti: true,
                    dbupsert: false
                }, function (gotData) {

                    data.removedmember = data.members;

                    data.returns = gotData.returns;
                    process.emit('next', data);
                });

            } else if (data.action === 'name') {
                process.hook('hook_db_update', {
                    dbcollection: 'groups',
                    dbquery: query,
                    dbupdate: {
                        $set: {
                            name: data.name
                        }
                    },
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
        event: function (data) {

            if (data.post.members && data.post.groupid && objectID.isValid(data.post.groupid)) {

                if (data.post.apikey && data.post.secretkey) {
                    process.hook('hook_secretkey_check', {
                        apikey: data.post.apikey,
                        secretkey: data.post.secretkey
                    }, function (valid) {
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
                    process.hook('hook_auth_check', {
                        userid: data.post.userid,
                        token: data.post.token
                    }, function (gotData) {
                        if (gotData.returns === true) {

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
        event: function (data) {

            if (data.post.members && data.post.groupid && objectID.isValid(data.post.groupid)) {

                if (data.post.apikey && data.post.secretkey) {
                    process.hook('hook_secretkey_check', {
                        apikey: data.post.apikey,
                        secretkey: data.post.secretkey
                    }, function (valid) {
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
                    process.hook('hook_auth_check', {
                        userid: data.post.userid,
                        token: data.post.token
                    }, function (gotData) {
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
        event: function (data) {

            if (data.post.name && data.post.groupid && objectID.isValid(data.post.groupid)) {

                if (data.post.apikey && data.post.secretkey) {
                    process.hook('hook_secretkey_check', {
                        apikey: data.post.apikey,
                        secretkey: data.post.secretkey
                    }, function (valid) {
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
                    process.hook('hook_auth_check', {
                        userid: data.post.userid,
                        token: data.post.token
                    }, function (gotData) {
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
    hook_post_group_remove: {
        rank: 0,
        event: function (data) {
            // only works for read-only groups
            // secret key, groupid

            if (data.post.apikey && data.post.secretkey && data.post.groupid && objectID.isValid(data.post.groupid)) {
                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (valid) {
                    if (valid.returns === true) {

                        // Delete the group in the database
                        process.hook('hook_db_remove', {
                            dbcollection: 'groups',
                            dbquery: {
                                '_id': objectID(data.post.groupid),
                                'isReadOnly': true
                            }
                        }, function (deleteReturns) {
                            data.returns = deleteReturns.returns;
                            process.emit('next', data);
                        });

                    } else {
                        data.returns = "ERROR: Secret key incorrect";
                        process.emit('next', data);
                    }

                });

            } else {
                data.returns = "ERROR: Missing secret key or groupid.";
                process.emit('next', data);
            }
        }
    },
    hook_post_group_resetmembers: {
        rank: 0,
        event: function (data) {
            // only works for read-only groups
            // secret key, groupid

            if (data.post.apikey && data.post.secretkey && data.post.groupid && objectID.isValid(data.post.groupid)) {
                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (valid) {
                    if (valid.returns === true) {

                        // Blank members of group in the database
                        process.hook('hook_db_update', {
                            dbcollection: 'groups',
                            dbquery: {
                                '_id': objectID(data.post.groupid),
                                'isReadOnly': true
                            },
                            dbupdate: {
                                $set: {
                                    'members': []
                                }
                            }
                        }, function (deleteReturns) {
                            data.returns = deleteReturns.returns;
                            process.emit('next', data);
                        });

                    } else {
                        data.returns = "ERROR: Secret key incorrect";
                        process.emit('next', data);
                    }

                });

            } else {
                data.returns = "ERROR: Missing secret key or groupid.";
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
                dbquery: {
                    '_id': messageid
                }
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
