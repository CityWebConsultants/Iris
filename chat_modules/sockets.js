/*jslint node: true */

"use strict";

var io = require('socket.io');
var auth = require('../chat_modules/auth');

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.socketio = io(process.server);
            process.socketio.on("connection", function (socket) {
                
                //Handshake message to trigger a pair callback from client
                
                socket.emit("handshake");
                  
                socket.on("pair", function (data) {
                   
                    data.callback = function (check) {
                        
                        if (check.authenticated) {
                            if (auth.userlist[data.userid]) {
                                // Push socket to userlist
                                auth.userlist[data.userid].socket = socket;
                                socket.emit('pair', true);
                            }
                        } else {
                            socket.emit('pair', false);
                        }
                        
                    };
                    
                    process.hook("hook_auth_check", data);
                    
                    
                });
                
            });
            
        });
        
    }
};

module.exports = exports;
