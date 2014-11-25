/*jslint node: true */

"use strict";

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data, socket) {
               
                socket.emit("handshake", data);
                
            });
            
        });
        
    }
};

module.exports = exports;
