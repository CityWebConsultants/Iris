/*jslint node: true */

"use strict";

var exports = {
    init: function(){
    
        process.nextTick(function(){
            
        process.socketio.on("connection", function(socket){
            
            socket.on("message", function(data){
                
                process.hook("hook_message_add",{content:data});
                
            });
           
        });
            
        });    
        
    }
};

module.exports = exports;
