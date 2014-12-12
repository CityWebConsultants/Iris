/*jslint node: true */
"use strict";

/*  Socket Tools Module
 *  Provides some useful socket functions not implemented by the base Sockets module.
 *
 *  Provides hook_groupid_from_messageid and hook_socket_users_push
 */

var objectID = require('mongodb').ObjectID;

var exports = {
    hook_groupid_from_messageid: {
        rank: 0,
        event: function (data) {
            var messageid = objectID(data.messageid);

            process.hook('hook_db_find', {
                dbcollection: 'messages',
                dbquery: {'_id': messageid}
            }, function (gotData) {
                data.returns = JSON.parse(gotData.returns)[0].groupid;
                process.emit('next', data);
            });
        }
    },
    hook_socket_users_push: {
        rank: 0,
        event: function (data) {
            // users (array), socketname, messageobject

//            console.log(data.users);

            data.users.forEach(function (element, item) {

                var user = element.userid;
                //Send message to recipient if logged in

                console.log("Push to " + element.userid + ' on ' + data.socketname + ': ' + data.messageobject);

                if (process.userlist[user] && process.userlist[user].socket) {
                    process.userlist[user].socket.emit(data.socketname, data.messageobject);
                }

            });

            process.emit('next', data);
        }
    }
};

module.exports = exports;
