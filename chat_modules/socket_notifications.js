/*jslint node: true */
"use strict";

/*  Socket Notifications Module
 *  Pushes notifications to the client informing them of message revocation or editing.
 *
 *  Implements hook_message_edit and hook_message_remove.
 */

var auth = require('../chat_modules/auth');
var objectID = require('mongodb').ObjectID;

var exports = {
  options: {
    notify_edit: true,
    notify_delete: true,
    silent: true
  },
  init: function () {
    process.addSocketListener("user_communicate", function (data, socket) {
      process.hook('hook_auth_check', {
        userid: data.userid,
        token: data.token
      }, function (authorised) {
        if (authorised.returns === true) {
          process.userBroadcast(data.userid, "user_communicate", data.message);
        }
      });
    });
  },
  hook_message_edit: {
    rank: 10,
    event: function (data) {

      // Validate.
      process.hook('hook_db_find', {
        dbcollection: 'messages',
        dbquery: {
          userid: data.userid,
          '_id': objectID(data.messageid)
        }
      }, function (query) {

        if (query.returns && query.returns !== '[]' && JSON.parse(query.returns)[0]) {

          process.hook('hook_groupid_from_messageid', {
            messageid: data.messageid
          }, function (groupid) {

            process.groupBroadcast(groupid.returns, 'notification_message', {
              messageid: data.messageid,
              action: 'edit',
              groupid: groupid.returns,
              content: data.content,
              type: data.messagetype,
              time: Date.now()
            });

            process.emit('next', data);

          });

        } else {
          process.emit('next', data);
        }

      });
    }
  },
  hook_message_remove: {
    rank: 0,
    event: function (data) {

      // Validate.
      process.hook('hook_db_find', {
        dbcollection: 'messages',
        dbquery: {
          userid: data.userid,
          '_id': objectID(data.messageid)
        }
      }, function (query) {

        if (query.returns && query.returns !== '[]' && JSON.parse(query.returns)[0]) {

          process.hook('hook_groupid_from_messageid', {
            messageid: data.messageid
          }, function (groupid) {

            process.groupBroadcast(groupid.returns, 'notification_message', {
              messageid: data.messageid,
              groupid: groupid.returns,
              action: 'remove',
              time: Date.now()
            });

            process.emit('next', data);

          });

        } else {
          process.emit('next', data);
        }

      });

    }
  },
  hook_group_add: {
    rank: 10,
    event: function (data) {
      if (data.success) {
        process.groupBroadcast(data.returns.toString(), 'notification_message', {
          action: 'addgroup',
          groupid: data.returns,
          time: Date.now()
        });
      }

      process.emit('next', data);
    }
  },
  hook_group_update: {
    rank: 10,
    event: function (data) {

      switch (data.action) {
        case 'addmember':
          process.groupBroadcast(data.groupid, 'notification_message', {
            action: 'addmember',
            groupid: data.groupid,
            time: Date.now()
          });

          process.emit('next', data);
          break;
        case 'removemember':
          if (data.removedmember) {
            // Send message-removed to that user's sockets.
            process.userBroadcast(data.removedmember, 'notification_message', {
              action: 'removedfromgroup',
              member: data.removedmember,
              groupid: data.groupid,
              time: Date.now()
            });
          }

          // And send to everyone.
          process.groupBroadcast(data.groupid, 'notification_message', {
            action: 'removemember',
            groupid: data.groupid,
            time: Date.now()
          });

          process.emit('next', data);
          break;
        case 'name':
          process.groupBroadcast(data.groupid, 'notification_message', {
            action: 'name',
            groupid: data.groupid,
            time: Date.now()
          });

          process.emit('next', data);
          break;
      }
    }
  },
  hook_send_joined_message: {
    rank: 1,
    event: function (data) {

      // expects userid, members, groupid

      var requester;

      // If done with secretkey then it's systemuser
      if (!data.userid) {
        requester = process.config.systemuser;
      } else {
        requester = data.userid;
      }

      process.hook('hook_message_add', {
        userid: data.members,
        groupid: data.groupid,
        content: {
          groupupdate: JSON.stringify({
            userid: data.members,
            action: 'add',
            requester: requester
          })
        },
        strong_auth_check: false
      }, function (gotData) {
        process.emit('next', data);
      });

    }
  }
};

module.exports = exports;
