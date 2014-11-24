/*jslint node: true */

"use strict";

var exports = {
    hook_message_add: {
        
    rank: 1,
    event: function(data){
    
        process.nextTick(function(){
    
            process.emit("next", data);
            
        });    
}
        
        
    }
};

module.exports = exports;