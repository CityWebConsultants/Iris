/*jslint node: true */

"use strict";

var auth = require('../chat_modules/auth');

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data, socket) {
                
                process.hook("hook_group_list_users", {groupid : data.to}, function (groupusers) {
                    
                    if (groupusers.returns) {

                        // userid = userid of message sender
                        var key,
                            userid;
                        for (key in auth.userlist) {
                            if (auth.userlist[key].sockets) {

                                auth.userlist[key].sockets.forEach(function (element, index) {
                                    if (element === socket) {
                                        console.log('userid: ' + key);
                                        userid = key;
                                    }
                                });

                                break;
                            }
                        }

                        // Stop if there's no userid
                        if (!userid) {
                            process.emit('next', data);
                        }

                        process.hook('hook_message_add', {groupid: data.to, 'userid': userid, content: data.content, strong_auth_check: true}, function (gotData) {
                            
                            data.messageid = gotData.returns;

                            process.hook('hook_message_process', {groupid: data.to, 'userid': userid, content: data.content}, function (gotData) {

                                //Clear user token. Shouldn't be sent to all users!
                                
                                data.token = "";
                                
                                process.groupBroadcast(data.to, 'message', data);

                            });

                        });

                    }
                    
                });
                
            });
            
        });
        
    }

};

module.exports = exports;
