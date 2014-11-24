/*jslint node: true */

var io = require('socket.io');

"use strict";

var exports = {
    init: function(){
    
        process.nextTick(function(){
            
            process.socketio = io(process.server)
           
//            Example usage
//            
//            process.socketio.on("connection", function(socket){
//   
//                socket.emit("hello","world");
//    
//            });
            
        });    
        
    }
};

module.exports = exports;
