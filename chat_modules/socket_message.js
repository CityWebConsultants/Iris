/*jslint node: true */

"use strict";

var auth = require('../chat_modules/auth');

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data, socket) {
                
                process.hook("hook_group_list_users", {groupid : data.to}, function (groupusers) {
                    
                    if (groupusers.returns) {
//                        console.log(auth.userlist);

                        var key,
                            userid;
                        for (key in auth.userlist) {
                            if (auth.userlist[key].socket && auth.userlist[key].socket === socket) {
//                                console.log('userid: ' + key);
                                userid = key;
                                break;
                            }
                        }

                        process.hook('hook_message_add', {groupid: data.to, 'userid': userid, content: data.content, strong_auth_check: true}, function (gotData) {
                            console.log('everything got: ' + JSON.stringify(gotData));
                            data.messageid = gotData.returns;
                            console.log(gotData.returns);

                            process.hook('hook_message_process', {groupid: data.to, 'userid': userid, content: data.content}, function (gotData) {
                                groupusers.returns.forEach(function (element, item) {

                                    var user = element.userid;
                                    //Send message to recipient if logged in

                                    if (process.userlist[user] && process.userlist[user].socket) {
                                        process.userlist[user].socket.emit("message", {
                                            messageid: data.messageid,
                                            groupid: data.to,
                                            'userid': userid,
                                            content: gotData.content
                                        });
                                    }

                                });

                            });

                        });

                    }
                    
                });
                
            });
            
        });
        
    }

};

module.exports = exports;
