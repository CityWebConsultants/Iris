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
    }
};

module.exports = exports;
