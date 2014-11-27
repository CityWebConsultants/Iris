/*jslint node: true */

"use strict";

var auth = require('../chat_modules/auth');

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data, socket) {
                
                process.hook("hook_group_list_users", {groupid : data.to}, function (groupusers) {
                    
                    if (groupusers.returns) {
                        console.log(auth.userlist); //want indexof
                        process.hook('hook_message_process', {groupid: data.to, content: data.content}, function (gotData) {
                            groupusers.returns.forEach(function (element, item) {

                                var user = element.userid;
                                //Send message to recipient if logged in

                                if (process.userlist[user] && process.userlist[user].socket) {
                                    process.userlist[user].socket.emit("message", gotData.content);

                                    //process.hook('hook_message_add', {gotData.us

                                }

                            });

                        });

                    }
                    
                });
                
            });
            
        });
        
    }

};

module.exports = exports;
