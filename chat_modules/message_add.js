/*jslint node: true nomen: true plusplus: true */

"use strict";

var exports = {
    // POST /message/add
    hook_post_message_add: {
        rank: 1,
        event: function (data) {
            process.hook('hook_auth_check', {userid: data.get.userid, token: data.get.token}, function (gotData) {
                if (gotData.returns === true) {
                    if (data.post.userid && data.post.groupid && data.post.content && data.post.messagetype) {
                        var content = {};
                        console.log('test');

                        content[data.post.messagetype] = data.post.content;

                        process.hook('hook_message_add', {
                            'userid': data.post.userid,
                            'groupid': data.post.groupid,
                            'content': content,
                            strong_auth_check: true
                        }, function (gotData) {
                            data.returns = gotData.returns.toString();
                            process.emit('next', data);
                        });
                    } else {
                        data.returns('ERROR: Missing userid, groupid, content or messagetype.');
                        process.emit('next', data);
                    }
                } else {
                    data.returns = "ERROR: Authentication failed.";
                    process.emit('next', data);
                }
            });
        }
    },
    hook_message_add: {
        rank: 1,
        event: function (data) {
            console.log("[INFO] Message received: " + JSON.stringify(data.content));

            var message = {
                userid: data.userid,
                groupid: data.groupid,
                content: data.content
            };
            
            if (data.strong_auth_check === true) {

                process.hook('hook_group_list_users', {
                    userid: data.userid,
                    groupid: data.groupid

                }, function (gotData) {
                    var authorised = false,
                        i;

                    if (typeof gotData.returns !== 'string') {

                        // Ensure user is in group and set flag
                        for (i = 0; i < gotData.returns.length; i++) {
                            console.log(gotData.returns[i]);
                            if (gotData.returns[i].userid === data.userid) {
                                console.log(gotData.returns[i]);
                                authorised = true;
                                // No point in looping through the rest, so break
                                break;
                            }
                        }

                    }

                    // Insert message into database
                    if (authorised === true) {
                        process.hook('hook_db_insert', {dbcollection: 'messages', dbobject: message}, function (gotData) {
                            data.returns = gotData.returns[0]._id;
                            process.emit('next', data);
                        });

                    } else {
                        data.returns = false;
                        process.emit('next', data);
                    }

                });

            // No strong auth check; insert whatever
            } else {
                console.log('[INFO] Strong authorisation check bypassed.');
                process.hook('hook_db_insert', {dbcollection: 'messages', dbobject: message}, function (gotData) {
                    data.returns = gotData.returns[0]._id;
                    process.emit('next', data);
                });
            }
        }
    }
};

module.exports = exports;
