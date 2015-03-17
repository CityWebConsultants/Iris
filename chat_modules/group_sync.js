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
                    content.gid: Drupal group node ID reference
                    content.name: Group name
                    content.members: Array of member user IDs
                    content.avatar: URL for group image
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

                        process.hook('hook_db_update', {
                            dbcollection: 'groups',
                            dbquery: {
                                gidref: data.post.gid
                            },
                            dbupdate: {
                                name: data.post.name,
                                isReadOnly: true,
                                lastupdated: Date.now(),
                                gidref: data.post.gid,
                                avatar: data.post.avatar,
                                members: members
                            },
                            dbupsert: true
                        }, function (update) {

                            data.returns = "Updated";

                            process.emit("next", data);

                        });

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

            if (data.post.apikey && data.post.secretkey) {

                process.hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        process.hook("hook_db_find", {
                            dbcollection: 'groups',
                            dbquery: {
                                'gidref': data.post.gid,
                                'isReadOnly': true
                            }
                        }, function (groupid) {

                            console.log(groupid.returns);

//                            process.groupBroadcast(groupid.returns, "notification_message", {
//                                action: "removegroup",
//                                time: Date.now()
//                            });

                            // Delete the group in the database
                            process.hook('hook_db_remove', {
                                dbcollection: 'groups',
                                dbquery: {
                                    'gidref': data.post.gid,
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
                                gidref: data.post.gid,
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
                                    gidref: data.post.gid,
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
                                gidref: data.post.gid,
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
                                gidref: {$exists: true},
                                isReadOnly: true
                            }
                        }, function (groups) {

                            console.log(groups);

                            groups = JSON.parse(groups.returns);

                            data.returns = [];

                            groups.forEach(function (element, index) {

                                var returnobject = {};
                                returnobject[element.gidref] = true;

                                data.returns.push(returnobject);
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
