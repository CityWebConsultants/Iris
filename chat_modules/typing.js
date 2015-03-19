/*jslint node: true */
"use strict";

/*  Typing Notifications Module
 *  Pushes notifications to the client informing them that a user is typing a message.
 *
 */

process.typing = {};

process.addSocketListener("typingstart", function (data) {

    if (!process.typing[data.userid]) {

        process.groupBroadcast(data.groupid, "typingstart",
                               {user:process.usercache[data.userid],group:data.groupid}
        );

    }

    process.typing[data.userid] = data.userid;

});

process.addSocketListener("typingstop", function (data) {

    process.groupBroadcast(data.groupid, "typingstop", {user:process.usercache[data.userid],group:data.groupid});
    
    delete process.typing[data.userid];

});

module.exports = exports;