/*jslint node: true */

"use strict";

var exports = {
    init: function () {
    
        process.nextTick(function () {
            
            process.addSocketListener("message", function (data) {
               
                console.log(data);
                
            });
            
        });
        
    }
};

module.exports = exports;
