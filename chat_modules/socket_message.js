/*jslint node: true */

"use strict";

var exports = {
    init: function(){
    
        process.nextTick(function(){
            
        process.socketio.on("connection", function(){
           
            process.hook("hook_message_add",{greeting:"hello"});
            
        });
            
        });    
        
    }
};

module.exports = exports;
