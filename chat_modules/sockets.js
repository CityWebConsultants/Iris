/*jslint node: true */

"use strict";

var io = require('socket.io');
var auth = require('../chat_modules/auth');

var socketapi = function (socket) {
 
    exports.listeners.forEach(function (element, index) {
        
        var callback;
        
        (function () {

            callback = function (data) {
              
                element.callback(data, socket);
                
            };
            
        }());
       
        socket.on(element.event, callback);
        
    });
    
};

var exports = {
    
    listeners: [],
    addlistener: function (listener, callback) {
        
        exports.listeners.push({event : listener, callback : callback});
        
    },
    init: function () {
    
        process.nextTick(function () {
            
            process.socketio = io(process.server);
            process.socketio.on("connection", function (socket) {
                
                //Add listeners
                
                socketapi(socket);
                
                //Handshake message to trigger a pair callback from client
                
                socket.emit("handshake", "Connection made");
                  
                socket.on("pair", function (data) {
                    
                    process.hook("hook_auth_check", data, function (check) {
                                                
                        if (check.authenticated) {
                            if (auth.userlist[data.userid]) {
                                // Push socket to userlist
                                auth.userlist[data.userid].socket = socket;
                                socket.emit('pair', true);
                            }
                        } else {
                            socket.emit('pair', false);
                        }
                        
                    });
                    
                    
                });
                
            });
            
        });
        
    }
};

process.addSocketListener = exports.addlistener;

module.exports = exports;