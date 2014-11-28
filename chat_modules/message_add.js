/*jslint node: true nomen: true */

"use strict";

var exports = {
    // POST /message/add
    hook_post_message_add: {
        rank: 1,
        event: function (data) {
            data.content = data.post.content;
            data.returns = "message received";

            process.emit('next', data);

            process.nextTick(function () {
                process.hook("hook_message_add", data);
            });
        }
    },
    hook_message_add: {
        rank: 1,
        event: function (data) {
            console.log("[INFO] Message received: " + data.content);

            var message = {
                userid: data.userid,
                groupid: data.groupid,
                content: data.content
            };
            
            console.log(JSON.stringify(message));

            process.hook('hook_db_insert', {dbcollection: 'messages', dbobject: message}, function (gotData) {
                data.returns = gotData.returns[0]._id;
                process.emit('next', data);
            });
        }
    }
};

module.exports = exports;
