/*jslint node: true nomen: true plusplus: true */

"use strict";

var objectID = require('mongodb').ObjectID;

var exports = {
    // POST /group/sync
    hook_post_group_sync: {
        rank: 1,
        event: function (data) {
            if (data.post.secretkey) {

                /*
                Expected data:
                    content.gid: Drupal group node ID reference
                    content.name: Group name
                    content.members: Array of member user IDs
                    content.avatar: URL for group image
                */
                process.hook('hook_secretkey_check', {
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

            if (data.post.secretkey) {

                process.hook('hook_secretkey_check', {
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

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

                    } else {
                        process.emit("next", data);
                    }
                });

            } else {
                process.emit("next", data);
            }
        }
    }
};

module.exports = exports;
