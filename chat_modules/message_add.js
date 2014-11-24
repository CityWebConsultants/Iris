/*jslint node: true */

"use strict";

var exports = {
    hook_message_add: {
        
    rank: 1,
    event: function(data){
    
        process.nextTick(function(){
            
            console.log("Message received: " + data.content);
    
            process.emit("next", data);
            
        });    
}
        
        
    }
};

module.exports = exports;