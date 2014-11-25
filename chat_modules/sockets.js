/*jslint node: true */

"use strict";

var io = require('socket.io');
var auth = require('../chat_modules/auth');

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.socketio = io(process.server);
            process.socketio.on("connection", function (socket) {
                  
                socket.on("pair", function (data) {
                   
                    data.callback = function (check) {
                        
                        console.log(check.authenticated);
                        
                    };
                    
                    process.hook("hook_auth_check", data);
                    
                    
                });
                
            });
            
        });
        
    }
};

module.exports = exports;
