/*jslint node: true */

"use strict";

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data, socket) {
                
                process.hook("hook_group_list_users", {groupid : data.to}, function (groupusers) {
                    
                    if (groupusers) {
                     
                        groupusers.forEach(function (element, item) {
                         
                            //Send message to recipient if logged in
               
                            if (process.userlist[data.to] && process.userlist[data.to].socket) {
                 
                                process.userlist[data.to].socket.emit("handshake", data.content);
                               
                            }
                         
                        });
                        
                    }
                    
                });
                
            });
            
        });
        
    }
};

module.exports = exports;
