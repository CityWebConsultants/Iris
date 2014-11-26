/*jslint node: true */

"use strict";

var exports = {
    
    hook_page_home: {
        rank: 0,
        event: function (data) {
            data.returns = '<script src="https://cdn.socket.io/socket.io-1.2.1.js"></script><script>var socket = io(document.location.origin);socket.on("handshake", function(data){console.log(data);});</script>';
            process.emit("next", data);
            
        }
    }
};

module.exports = exports;
