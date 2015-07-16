/*jslint node: true nomen: true plusplus: true */

"use strict";

/*  Message Editing Module
 *  Provides hooks and API endpoints for revoking and editing messages. Directly edits database
 *  and sends system messages to clients informing them of edits and revokes.
 *
 *  Implements hook_message_remove and hook_message_edit
 *
 *  API endpoints:
 *  /message/remove
 *  /message/edit
 */

var objectID = require('mongodb').ObjectID;

var exports = {
  hook_message_edit: {
    rank: 1,
    event: function (data) {

      hook('hook_db_update', {
        dbcollection: 'messages',
        dbquery: {
          '_id': objectID(data.messageid),
          userid: data.userid
        },
        dbupdate: {
          $set: {
            'content': data.content,
            'type': data.type,
            'public': data.public
          }
        },
        dbupsert: false,
        dbmulti: false
      }, function (gotData) {
        data.returns = gotData.returns;
        process.emit('next', data);

      });
    }
  },
  hook_message_remove: {
    rank: 10,
    event: function (data) {
      hook('hook_db_remove', {
        dbcollection: 'messages',
        dbquery: {
          '_id': objectID(data.messageid),
          userid: data.userid
        }

      }, function (gotData) {
        data.returns = gotData.returns;
        process.emit('next', data);

      });
    }
  },
  hook_post_message_remove: {
    rank: 0,
    event: function (data) {
      if (data.post.userid &&
        data.post.token &&
        data.post.messageid &&
        objectID.isValid(data.post.messageid)
      ) {
        hook('hook_auth_check', {
          userid: data.post.userid,
          token: data.post.token
        }, function (gotData) {

          if (gotData.returns === true) {

            hook('hook_message_remove', {
              userid: data.post.userid,
              messageid: data.post.messageid

            }, function (gotData) {
              data.returns = gotData.returns.toString();
              process.emit('next', data);

            });

          } else {
            data.returns = "ERROR: Authentication failed.";
            process.emit('next', data);

          }

        });
        // Missing required data
      } else {
        data.returns = "ERROR: userid, token or messageid not supplied.";
        process.emit('next', data);

      }
    }
  },
  hook_post_message_edit: {
    rank: 0,
    event: function (data) {

      // Check all data is present and that IDs are valid.
      if (
        data.post.userid &&
        data.post.token &&
        data.post.content &&
        data.post.messageid &&
        data.post.type &&
        objectID.isValid(data.post.messageid)
      ) {

        data.userid = data.post.userid;
        data.token = data.post.token;

        if (data.post.public === "true") {
          data.post.public = true;
        } else {
          data.post.public = false;
        }

        var checkMessagePrivate = function (data) {

          return new Promise(function (yes, no) {

            if (data.post.public) {

              hook('hook_db_find', {
                dbcollection: 'messages',
                dbquery: {
                  _id: objectID(data.post.messageid)
                }
              }, function (message) {

                message = JSON.parse(message.returns)[0];

                C.message_add.checkPrivate(message.groupid, function (isPrivate) {

                  if (data.post.public && isPrivate) {
                    data.post.public = false;
                  }

                  yes(data);

                });

              });

            } else {
              yes(data);
            }

          });

        };

        var editMessage = function (data) {

          return new Promise(function (yes, no) {

            hook('hook_message_preprocess', {
              message: {
                content: data.post.content,
                userid: data.post.userid,
                type: data.post.type
              }
            }, function (sanitisedmessage) {

              hook('hook_message_edit', {
                userid: data.post.userid,
                messageid: data.post.messageid,
                type: data.post.type,
                content: sanitisedmessage.returns.content,
                public: data.post.public

              }, function (gotData) {

                data.returns = gotData.returns.toString();
                yes(data);

              });

            });

          });

        };

        hookPromiseChain([C.auth.authCheck, checkMessagePrivate, editMessage], data);

        // Missing required data
      } else {
        data.returns = "ERROR: userid, token, messageid, type or content not supplied.";
        process.emit('next', data);

      }
    }
  }

};

module.exports = exports;
