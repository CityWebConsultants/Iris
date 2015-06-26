/*jslint node: true nomen: true plusplus: true */

"use strict";

var exports = {
  
  // POST /message/add
  hook_post_message_add: {
    rank: 1,
    event: function (data) {

      //Function for adding all messages (with admin check)

      var addmessage = function (admin) {

        process.hook('hook_message_add', {
          'userid': data.post.userid,
          'groupid': data.post.groupid,
          'type': data.post.messagetype,
          'content': data.post.content,
          'tags': [data.post.messagetype],
          strong_auth_check: !admin
        }, function (gotData) {
          data.returns = JSON.stringify(gotData.returns);
          process.emit('next', data);
        });

      };

      //Check if user is admin

      if (data.post.userid && data.post.apikey && data.post.secretkey && (data.post.groupid || data.post.groupref) && data.post.content && data.post.messagetype) {
        process.hook('hook_secretkey_check', {
          apikey: data.post.apikey,
          secretkey: data.post.secretkey
        }, function (check) {

          if (check.returns === true) {

            //Convert group ref to group id

            if (data.post.groupref) {

              process.hook("hook_db_find", {
                dbcollection: 'groups',
                dbquery: {
                  'entityref': data.post.groupref,
                  'isReadOnly': true
                }
              }, function (groupid) {

                //TODO check if group returned, if not return error

                data.post.groupid = JSON.parse(groupid.returns)[0]._id;

                addmessage(true);

              });

            } else {

              addmessage(true);

            }

          } else {

            data.returns = "ERROR: Invalid secretkey";
            process.emit('next', data);

          }

        });

      } else if (data.post.userid && data.post.token && data.post.groupid && data.post.content && data.post.messagetype) {
        process.hook('hook_auth_check', {
          userid: data.post.userid,
          token: data.post.token
        }, function (gotData) {
          if (gotData.returns === true) {

            addmessage(false);

          } else {
            data.returns = "ERROR: Authentication failed.";
            process.emit('next', data);
          }
        });
      } else {
        data.returns = 'ERROR: Missing userid, token, groupid, content or messagetype.';
        process.emit('next', data);
      }
    }
  },
  hook_message_preprocess: {
    rank: 0,
    event: function (data) {

      if (data.message.type === "text") {
        var skip = false;
        if (process.config.admins) {
          process.config.admins.forEach(function (element) {
            if (data.message.userid === element) {
              skip = true;
            }
          });
        }

        if (skip === false) {
          // Strip HTML.
          data.message.content = data.message.content
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\//g, '&#47;');
        }

      }

      data.returns = data.message;
      process.emit('next', data);

    }
  },
  hook_message_add: {
    rank: 1,
    event: function (data) {
      console.log("[INFO] Adding message: " + JSON.stringify(data.content));

      var message = {
        userid: data.userid,
        groupid: data.groupid,
        content: data.content,
        type: data.type,
        tags: data.tags
      };

      process.hook('hook_message_preprocess', {
        message: message
      }, function (processedMessage) {

        if (processedMessage.returns) {
          message = processedMessage.returns;
        }

        if (data.strong_auth_check === true) {

          process.hook('hook_group_list_users', {
            userid: data.userid,
            groupid: data.groupid

          }, function (gotData) {
            var authorised = false,
              i;

            if (typeof gotData.returns !== 'string') {

              // Ensure user is in group and set flag
              for (i = 0; i < gotData.returns.length; i++) {
                if (gotData.returns[i].userid === data.userid) {
                  authorised = true;
                  // No point in looping through the rest, so break
                  break;
                }
              }

            }

            // Insert message into database
            if (authorised === true) {
              process.hook('hook_db_insert', {
                dbcollection: 'messages',
                dbobject: message
              }, function (gotData) {
                data.returns = gotData.returns[0]._id;

                if (process.usercache[message.userid]) {

                  //Translate username from cache
                  message.username = process.usercache[message.userid].username;
                };


                // Actually send message
                process.groupBroadcast(data.groupid, 'message', message);

                process.emit('next', data);
              });

            } else {
              data.returns = false;
              process.emit('next', data);
            }

          });

          // No strong auth check; insert whatever
        } else {
          console.log('[INFO] Strong authorisation check bypassed.');
          process.hook('hook_db_insert', {
            dbcollection: 'messages',
            dbobject: message
          }, function (gotData) {
            data.returns = gotData.returns[0]._id;

            //Translate username from cache

            if (process.usercache[message.userid]) {

              message.username = process.usercache[message.userid].username;

            };

            // Actually send message

            process.groupBroadcast(data.groupid, 'message', message);

            process.emit('next', data);
          });
        }

      });
    }
  }
};

module.exports = exports;
