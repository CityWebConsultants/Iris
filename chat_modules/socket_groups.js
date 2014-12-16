/*jslint node: true */

"use strict";

var auth = require('../chat_modules/auth');

var exports = {
    init: function () {
  
        //Socket listener for fetching a user's groups. Authenticate, check database and send back group IDs/information.
        
        process.addSocketListener("mygroups", function (data, socket) {

            process.hook("hook_auth_check",data,function(auth){
                
                if(auth.returns){
                    
                    process.hook("hook_fetch_groups", data, function(groups) {
                        
                        socket.emit("mygroups", groups.returns);
                        
                    }); 
                    
                } else {
                  
                    socket.emit("mygroups", false)
                    
                };
                
            });
            
        });
        
        //Socket listener for fetching messages of a group. Again, double check authentication. Return array of messages.
        
        process.addSocketListener("fetchmessages", function (data, socket) {

            process.hook("hook_auth_check",data,function(auth){
                
                if(auth.returns){
                    
                    process.hook("hook_group_list_messages", data, function(messages) {
                        
                        socket.emit("fetchmessages", messages.returns);
                        
                    }); 
                    
                } else {
                  
                    socket.emit("mygroups", false)
                    
                };
                
            });
            
        });
        
    }
};

module.exports = exports;
