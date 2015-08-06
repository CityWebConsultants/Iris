/*jslint node: true plusplus: true*/
"use strict";

/*  Activity Module
 *
 *  Provides tracking of group check ins
 *
 */
var objectID = require('mongodb').ObjectID;
var auth = require('../chat_modules/auth');

var exports = {

  init: function () {
    process.addSocketListener("groupcheckin", function (data, socket) {
      if (data.userid && data.token && data.groupid) {
        hook("hook_auth_check", {
          userid: data.userid,
          token: data.token
        }, function (auth) {
          if (auth.returns === true) {
            // Run checkin hook
            hook("hook_group_checkin", {
              userid: data.userid,
              groupid: data.groupid
            }, function (returns) {
              data.returns = true;
            });
          }
        });
      }
    });
    process.addSocketListener("focuscheckin", function (data, socket) {
      // todo: need auth?

      if (auth.userlist[socket.userid] && auth.userlist[socket.userid].sockets) {
        var done = false;
        auth.userlist[socket.userid].sockets.forEach(function (element, index) {
          if (!done && element.id === socket.id) {
            var moveSocket = element;
            auth.userlist[socket.userid].sockets.splice(index, 1);
            auth.userlist[socket.userid].sockets.push(moveSocket);
            process.updateLatestSocket(socket.userid);

            done = true;
          }
        });
      }

    });
  },
  hook_group_checkin: {
    rank: 0,
    event: function (data) {
      // userid, groupid
      hook('hook_db_update', {
        dbcollection: 'groups',
        dbquery: {
          '_id': objectID(data.groupid),
          'members.userid': data.userid
        },
        dbupdate: {
          $set: {
            'members.$.lastviewed': Date.now()
          }
        }
      }, function (result) {
        data.returns = result.returns;
        process.emit('next', data);
      });
    }
  },
  hook_message_add: {
    rank: 20,
    event: function (data) {
      // If message added successfully, i.e. previous hook actually returned

      if (data.returns) {
        hook('hook_db_update', {
          dbcollection: 'groups',
          dbquery: {
            '_id': objectID(data.groupid)
          },
          dbupdate: {
            '$set': {
              'lastupdated': Date.now()
            }
          }
        }, function (result) {
          process.emit('next', data);
        });
      }
    }
  },
  hook_group_add: {
    rank: 20,
    event: function (data) {
      // If group added successfully
      if (data.success === true) {
        hook('hook_db_update', {
          dbcollection: 'groups',
          dbquery: {
            '_id': objectID(data.returns.toString())
          },
          dbupdate: {
            '$set': {
              'lastupdated': Date.now()
            }
          }
        }, function (result) {
          process.emit('next', data);
        });
      } else {
        process.emit('next', data);
      }
    }
  }
};

module.exports = exports;
