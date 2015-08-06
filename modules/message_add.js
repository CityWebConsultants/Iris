/*jslint node: true nomen: true plusplus: true */

"use strict";

var sanitizeHtml = require('sanitize-html');
var objectID = require('mongodb').ObjectID;

var exports = {
  globals: {
    shouldMessageBePrivate: function (groupid, callback) {
      hook('hook_db_find', {
        dbcollection: 'groups',
        dbquery: {
          _id: objectID(groupid)
        }
      }, function (group) {

        group = JSON.parse(group.returns)[0];

        // Return true when the parent group is private
        if (!(group.permissions.read === 0 || group.permissions.read === '0')) {
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
      
      if (data.auth < 1) {

        data.returns = "ERROR: Authentication failed.";
        process.emit('next', data);
        return false;

      };

      //Function for adding all messages (with admin check)

      var addmessage = function () {

        hook('hook_message_add', {
          'userid': data.post.userid,
          'groupid': data.post.groupid,
          'type': data.post.type,
          'content': data.post.content,
          'hideFromPublicGroup': data.post.hideFromPublicGroup,
          'replyTo': data.post.replyTo
        }, function (gotData) {
          data.returns = JSON.stringify(gotData.returns);
          process.emit('next', data);
        });

      };

      //Check paramaters are valid

      if ((data.post.groupid || data.post.entityRef) &&
        data.post.content &&
        data.post.type && data.post.hideFromPublicGroup) {

        //Convert group ref to group id

        if (data.post.groupref) {

          hook("hook_db_find", {
            dbcollection: 'groups',
            dbquery: {
              'entityref': data.post.groupref,
            }
          }, function (groupid) {

            //TODO check if group returned, if not return error

            data.post.groupid = JSON.parse(groupid.returns)[0]._id;

            addmessage();

          });

        } else {

          addmessage();

        }
      } else {

        data.returns = "ERROR: Wrong paramaters supplied.";
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
        hideFromPublicGroup: data.hideFromPublicGroup,
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

      var permissionsCheck = function (data) {
        
        return new Promise(function (yes, no) {
          
          C.group_manager.isGroupMember(data.userid, data.groupid, function (result) {
                        
            if (result) {

              yes(data);

            } else {

              no(data);

            }

          })
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

      var insertMessageDB = function (data) {

        return new Promise(function (yes, no) {

          C.message_add.shouldMessageBePrivate(data.groupid, function (shouldBePrivate) {

            if (shouldBePrivate) {
              message.permissions['read'] = 2;
              console.log("made it private");

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

      hookPromiseChain([preprocessMessage, permissionsCheck, makeReply, insertMessageDB], data);

    }
  }
};

module.exports = exports;
