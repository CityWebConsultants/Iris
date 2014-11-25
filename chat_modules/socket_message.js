/*jslint node: true */

"use strict";

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data, socket) {
               
                if (process.userlist[data.to]) {
                 
                    process.userlist[data.to].socket.emit("handshake", data.content);
                           
                }
                
            });
            
        });
        
    }
};

module.exports = exports;
