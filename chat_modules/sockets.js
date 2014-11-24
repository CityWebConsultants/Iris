/*jslint node: true */

var io = require('socket.io');

"use strict";

var exports = {
    options: {},
    init: function(){
    
        process.nextTick(function(){
            
            process.io = io(process.server)
           
            process.io.on("connection", function(socket){
   
                socket.emit("hello","world");
    
            });
            
        });    
        
    }
};

module.exports = exports;
