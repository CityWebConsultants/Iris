/*jslint node: true */

var io = require('socket.io');

"use strict";

var exports = {
    init: function(){
    
        process.nextTick(function(){
            
            process.socketio = io(process.server)   
            
        });    
        
    }
};

module.exports = exports;
