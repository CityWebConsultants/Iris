/*jslint node: true */

"use strict";

var exports = {
    // POST /message/add
    hook_post_message_add:{
    rank: 1,
    event: function(data){
        
        data.content = data.post.content;
        
        data.returns = "message received";

        process.emit("next", data);
        
        process.nextTick(function(){
                    
        process.hook("hook_message_add", data);
        
        });
    }   
    },
    hook_message_add: {
        
    rank: 1,
    event: function(data){
    
            
        console.log("Message received: " + data.content);
        
        process.emit("next", data);

   
}
        
        
    }
};

module.exports = exports;
