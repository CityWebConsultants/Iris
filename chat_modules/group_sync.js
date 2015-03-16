/*jslint node: true nomen: true plusplus: true */

"use strict";

var exports = {
    hook_mongodb_ready: {
        rank: 1,
        event: function () {

            process.hook('hook_usercache', {}, function (data) {

                console.log("User cache updated with " + Object.keys(process.usercache).length + " users");

            });

        }
    },
    // POST /group/sync
    hook_post_group_sync: {
        rank: 1,
        event: function (data) {
            if (data.post.secretkey && data.post.content) {

                /*
                Expected data:
                    content.gid: Drupal group node ID reference
                    content.name: Group name
                    content.members: Array of member user IDs
                    content.avatar: URL for group image
                */

                var content;

                try {
                    content = JSON.parse(content);
                } catch (e) {
                    process.emit("next", data);
                    return;
                }

                process.hook('hook_secretkey_check', {
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        process.hook('hook_db_update', {
                            dbcollection: 'groups',
                            dbquery: {
                                gidref: content.gid
                            },
                            dbupdate: {
                                name: content.name,
                                isReadOnly: true,
                                lastupdated: Date.now(),
                                gidref: content.gid,
                                avatar: content.avatar,
                                members: {
                                    userid: content.members,
                                    joined: null
                                }
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
    }
};

module.exports = exports;
