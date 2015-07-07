/*jslint node: true nomen: true plusplus: true */

"use strict";

var sanitizeHtml = require('sanitize-html');
var objectID = require('mongodb').ObjectID;

var exports = {

  // POST /message/add
  hook_post_message_add: {
    rank: 1,
    event: function (data) {

      //Function for adding all messages (with admin check)

      var addmessage = function (admin) {

        console.log(data.post.public);

        process.hook('hook_message_add', {
          'userid': data.post.userid,
          'groupid': data.post.groupid,
          'type': data.post.messagetype,
          'content': data.post.content,
          'tags': [data.post.messagetype],
          'public': data.post.public,
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

        var admin = false;
        if (process.config.admins) {
          process.config.admins.forEach(function (element) {
            if (data.message.userid.toString() === element.toString()) {
              admin = true;
            }
          });
        }

        if (admin === true) {

          // Currently don't sanitize anything

        } else {

          if (exports.options.textFormats && exports.options.textFormats.default && exports.options.textFormats.default.sanitize === true) {
            // Sane defaults if undefined
            if (!exports.options.textFormats.default.allowedTags) {
              exports.options.textFormats.default.allowedTags = false;
            }
            if (!exports.options.textFormats.default.allowedAttributes) {
              exports.options.textFormats.default.allowedAttributes = false;
            }

            // SanitizeHtml
            data.message.content = sanitizeHtml(data.message.content, {
              allowedTags: exports.options.textFormats.default.allowedTags,
              allowedAttributes: exports.options.textFormats.default.allowedAttributes
            });
          }

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
        tags: data.tags,
        public: data.public
      };

      var preprocessMessage = function (data) {

        return new Promise(function (yes, no) {

          process.hook('hook_message_preprocess', {
            message: message
          }, function (processedMessage) {

            if (processedMessage.returns) {
              message = processedMessage.returns;
            }

            yes(data);

          });

        });

      };

      var strongAuthCheck = function (data) {

        return new Promise(function (yes, no) {
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

                yes(data);

              } else {

                data.returns = false;
                data.errors.push("Not authorised to post to that group.");
                no(data);

              }

            });

          } else {

            console.log("[INFO] Strong auth check bypassed.");

            yes(data);

          }

        });

      };

      var insertMessageDB = function(data) {

        return new Promise(function (yes, no) {

          var checkprivate = function(groupid, callback) {
            process.hook('hook_db_find', {
              dbcollection: 'groups',
              dbquery: {
                _id: objectID(groupid)
              }
            }, function (group) {

              group = JSON.parse(group.returns);

              // Force messages private when it doesn't make sense for them to be public
              if (!group.isReadOnly) {
                callback(true);
              } else if (group.private) {
                callback(true);
              } else {
                callback(false);
              }

            });
          };

          checkprivate(data.groupid, function (isPrivate) {

            if (data.public && isPrivate) {
              message.public = false;
            }

            console.log(message);

            process.hook('hook_db_insert', {
              dbcollection: 'messages',
              dbobject: message
            }, function (gotData) {
              data.returns = gotData.returns[0]._id;

              if (process.usercache[message.userid]) {

                //Translate username from cache
                message.username = process.usercache[message.userid].username;
              };


              // Actually send message via sockets
              process.groupBroadcast(data.groupid, 'message', message);

              yes(data);

            });

          });

        });

      };

      process.hookPromiseChain([preprocessMessage, strongAuthCheck, insertMessageDB], data);

    }
  }
};

module.exports = exports;
