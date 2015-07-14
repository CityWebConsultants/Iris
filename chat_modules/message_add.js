/*jslint node: true nomen: true plusplus: true */

"use strict";

var sanitizeHtml = require('sanitize-html');
var objectID = require('mongodb').ObjectID;

var exports = {
  globals: {
    checkPrivate: function(groupid, callback) {
      hook('hook_db_find', {
        dbcollection: 'groups',
        dbquery: {
          _id: objectID(groupid)
        }
      }, function (group) {

        group = JSON.parse(group.returns)[0];

        // Force messages private when it doesn't make sense for them to be public
        if (!group.isReadOnly) {
          callback(true);
        } else if (group.private) {
          callback(true);
        } else {
          callback(false);
        }

      });
    }
  },
  // POST /message/add
  hook_post_message_add: {
    rank: 1,
    event: function (data) {

      //Function for adding all messages (with admin check)

      var addmessage = function (admin) {

        hook('hook_message_add', {
          'userid': data.post.userid,
          'groupid': data.post.groupid,
          'type': data.post.messagetype,
          'content': data.post.content,
          'tags': [data.post.messagetype],
          'public': data.post.public,
          'replyTo': data.post.replyTo,
          strong_auth_check: !admin
        }, function (gotData) {
          data.returns = JSON.stringify(gotData.returns);
          process.emit('next', data);
        });

      };

      //Check if user is admin

      if (data.post.userid && data.post.apikey && data.post.secretkey && (data.post.groupid || data.post.groupref) && data.post.content && data.post.messagetype) {
        hook('hook_secretkey_check', {
          apikey: data.post.apikey,
          secretkey: data.post.secretkey
        }, function (check) {

          if (check.returns === true) {

            //Convert group ref to group id

            if (data.post.groupref) {

              hook("hook_db_find", {
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
        hook('hook_auth_check', {
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

      console.log(data.public);

      if (data.public !== true && data.public !== 'true') {
        data.public = false;
        console.log("made false");
      } else {
        data.public = true;
      }

      var message = {
        userid: data.userid,
        groupid: data.groupid,
        content: data.content,
        type: data.type,
        tags: data.tags,
        public: data.public,
        parents: ''
      };

      var preprocessMessage = function (data) {

        return new Promise(function (yes, no) {

          hook('hook_message_preprocess', {
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

            hook('hook_group_list_users', {
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

      var makeReply = function (data) {

        return new Promise(function (yes, no) {

          if (data.replyTo && data.replyTo !== 'null') {

            data.testing = true;

            if (objectID.isValid(data.replyTo)) {
              // Get parent message
              hook('hook_db_find', {
                dbcollection: 'messages',
                dbquery: {
                  _id: objectID(data.replyTo)
                }
              }, function (parentMessage) {

                parentMessage = JSON.parse(parentMessage.returns)[0];

                var id = new objectID();

                if (parentMessage.parents) {
                  parentMessage.parents.push(id);
                  message.parents = parentMessage.parents;
                }

                message._id = id;

                yes(data);

              });

            } else {

              data.errors.push("Invalid objectID for replyTo");
              no(data);

            }

          } else {

            var id = new objectID();

            message.parents = [id];

            message._id = id;

            yes(data);

          }

        });

      };

      var insertMessageDB = function(data) {

        return new Promise(function (yes, no) {

          process.globals.message_add.checkPrivate(data.groupid, function (isPrivate) {

            if (data.public && isPrivate) {
              message.public = false;

            }

            hook('hook_db_insert', {
              dbcollection: 'messages',
              dbobject: message
            }, function (gotData) {
              data.returns = gotData.returns[0]._id;

              if (process.usercache[message.userid]) {

                var usercache = {
                  username: process.usercache[message.userid].username,
                  avatar: process.usercache[message.userid].avatar
                };

                //Translate username from cache
                message.usercache = usercache;
              }


              // Actually send message via sockets
              process.groupBroadcast(data.groupid, 'message', message);

              yes(data);

            });

          });

        });

      };

      hookPromiseChain([preprocessMessage, strongAuthCheck, makeReply, insertMessageDB], data);

    }
  }
};

module.exports = exports;
