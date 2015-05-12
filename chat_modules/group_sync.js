/*jslint node: true nomen: true plusplus: true */

"use strict";

var objectID = require('mongodb').ObjectID;

var exports = {
    // POST /group/sync
    hook_post_group_sync: {
        rank: 1,
        event: function (data) {
            if (data.post.apikey && data.post.secretkey) {

                /*
                Expected data:

                    Global:
                        reftype: 'og', 'event'
                        name: Group name
                        members: Array of member user IDs
                        avatar: URL for group image

                    og:
                        entityref: Drupal group node ID reference

                    event:
                        entityref: Drupal event node ID reference
                        starttime: Timestamp of event start
                        endtime: Timestamp of event end
                        agenda: Array of meeting agenda items as field collection entities, JSON
                */
                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        var members = [];
                        JSON.parse(data.post.members).forEach(function (user, index) {

                            members.push({
                                userid: user
                            });

                        });

                        var update = {
                            name: data.post.name,
                            isReadOnly: true,
                            lastupdated: Date.now(),
                            avatar: data.post.avatar,
                            members: members,
                            reftype: data.post.reftype
                        };

                        if (data.post.reftype === 'og') {
                            update.entityref = data.post.gid;
                        } else if (data.post.reftype === 'event') {
                            update.entityref = data.post.eventid;

                            update.starttime = data.post.starttime;
                            update.endtime = data.post.endtime;
                            update.agenda  = data.post.agenda;
                        }

                        if (update.entityref) {

                            process.hook('hook_db_update', {
                                dbcollection: 'groups',
                                dbquery: {
                                    entityref: update.entityref
                                },
                                dbupdate: update,
                                dbupsert: true
                            }, function (updateresult) {

                                // Get group ID.
                                process.hook('hook_db_find', {
                                    dbcollection: 'groups',
                                    dbquery: {
                                        reftype: data.post.reftype,
                                        entityref: update.entityref
                                    }
                                }, function (groupdata) {

                                    groupdata = JSON.parse(groupdata.returns);

                                    // Broadcast sync notifcation message (makes clients reload group)
                                    process.groupBroadcast(groupdata[0]._id, 'notification_message', {
                                        groupid: groupdata[0]._id,
                                        action: 'sync',
                                        time: Date.now()
                                    });

                                    data.returns = "Updated";

                                    process.emit("next", data);

                                });

                            });

                        } else {
                            data.returns = "ERROR: Invalid entity reference type.";
                        }

                    } else {
                        process.emit('next', data);
                    }
                });
            }
        }
    },
    // POST /group/sync/delete
    hook_post_group_sync_delete: {
        rank: 1,
        event: function (data) {
            // expects secretkey, gid

            if (data.post.apikey && data.post.secretkey && data.post.reftype && data.post.entityref) {

                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        process.hook("hook_db_find", {
                            dbcollection: 'groups',
                            dbquery: {
                                'reftype': data.post.reftype,
                                'entityref': data.post.entityref,
                                'isReadOnly': true
                            }
                        }, function (groupid) {


                            // Delete the group in the database
                            process.hook('hook_db_remove', {
                                dbcollection: 'groups',
                                dbquery: {
                                    'reftype': data.post.reftype,
                                    'entityref': data.post.entityref,
                                    'isReadOnly': true
                                }
                            }, function (deleteReturns) {
                                // todo: remove all messages too

                                data.returns = deleteReturns.returns;
                                process.emit('next', data);
                            });

                        });

                    } else {
                        process.emit("next", data);
                    }
                });

            } else {
                process.emit("next", data);
            }
        }
    },
    // POST /group/sync/addmember
    hook_post_group_sync_addmember: {
        rank: 1,
        event: function (data) {
            // expects secretkey, gid, userid

            if (data.post.apikey && data.post.secretkey) {

                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        process.hook("hook_db_update", {
                            dbcollection: 'groups',
                            dbquery: {
                                entityref: data.post.gid,
                                isReadOnly: true
                            },
                            dbupdate: {
                                $push: {
                                    members: {
                                        'userid': data.post.members,
                                        'joined': Date.now()
                                    }
                                }
                            },
                            dbmulti: true
                        }, function (update) {

                            data.returns = update.returns;

                            process.hook("hook_db_find", {
                                dbcollection: 'groups',
                                dbquery: {
                                    entityref: data.post.gid,
                                    isReadOnly: true
                                }
                            }, function (gotData) {
                                gotData = JSON.parse(gotData.returns);

                                if (gotData[0] && gotData[0]._id) {

                                    process.hook("hook_send_joined_message", {
                                        members: data.post.members,
                                        groupid: gotData[0]._id
                                    }, function (gotData) {

                                        process.emit("next", data);

                                    });

                                } else {

                                    process.emit("next", data);

                                }
                            });

                        });

                    } else {
                        process.emit("next", data);
                    }
                });

            } else {
                process.emit("next", data);
            }
        }
    },
    // POST /group/sync/removemember
    hook_post_group_sync_removemember: {
        rank: 1,
        event: function (data) {
            // expects secretkey, gid, userid

            if (data.post.apikey && data.post.secretkey) {

                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        process.hook("hook_db_update", {
                            dbcollection: 'groups',
                            dbquery: {
                                entityref: data.post.gid,
                                isReadOnly: true
                            },
                            dbupdate: {
                                $pull: {
                                    members: {
                                        'userid': data.post.members
                                    }
                                }
                            },
                            dbmulti: true
                        }, function (update) {

                            data.returns = update.returns;

                            process.emit("next", data);

                        });

                    } else {
                        process.emit("next", data);
                    }
                });

            } else {
                process.emit("next", data);
            }
        }
    },
    // GET /group/sync/groupslist
    hook_get_group_sync_groupslist: {
        rank: 1,
        event: function (data) {

            if (data.get.apikey && data.get.secretkey) {

                process.hook('hook_secretkey_check', {
                    apikey: data.get.apikey,
                    secretkey: data.get.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        process.hook('hook_db_find', {
                            dbcollection: "groups",
                            dbquery: {
                                entityref: {$exists: true},
                                isReadOnly: true
                            }
                        }, function (groups) {

                            groups = JSON.parse(groups.returns);

                            data.returns = {};

                            groups.forEach(function (element, index) {

                                data.returns[element.entityref] = true;
                            });

                            data.returns = JSON.stringify(data.returns);

                            process.emit("next", data);

                        });

                    } else {
                        data.returns = "Bad secretkey.";
                        process.emit("next", data);
                    }
                });

            } else {
                data.returns = "No secretkey.";
                process.emit("next", data);
            }
        }
    }
};

module.exports = exports;
