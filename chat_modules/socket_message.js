/*jslint node: true */

"use strict";

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data, socket) {
                
                process.hook("hook_group_list_users", {groupid : data.to}, function (groupusers) {
                    
                    if (groupusers.returns) {
                     
                        groupusers.returns.forEach(function (element, item) {
                         
                            var user = element.userid;
                            //Send message to recipient if logged in
               
                            if (process.userlist[user] && process.userlist[user].socket) {
                 
                                process.userlist[user].socket.emit("message", data.content);
                               
                            }
                         
                        });
                        
                    }
                    
                });
                
            });
            
        });
        
    }
};

module.exports = exports;
