/*jslint node: true nomen: true plusplus: true */

"use strict";

var exports = {
  // POST /message/hub
//  hook_post_message_hub: {
//    rank: 1,
//    event: function (data) {
//      if (data.post.apikey && data.post.secretkey && data.post.gid && data.post.content) {
//        process.hook('hook_secretkey_check', {
//          apikey: data.post.apikey,
//          secretkey: data.post.secretkey
//        }, function (check) {
//          if (check.returns === true) {
//
//            var content = {};
//            if (data.post.text) {
//              content.text = data.post.content;
//            } else {
//              try {
//                content = JSON.parse(data.post.content);
//              } catch (ex) {
//                data.returns = "ERROR: Bad JSON content object.";
//                process.emit('next', data);
//              }
//            }
//
//            process.hook("hook_db_find", {
//              dbcollection: 'groups',
//              dbquery: {
//                'entityref': data.post.gid,
//                'isReadOnly': true
//              }
//            }, function (groupid) {
//
//              groupid = JSON.parse(groupid.returns);
//
//              process.hook('hook_message_add', {
//                userid: data.post.userid,
//                groupid: groupid[0]._id,
//                content: content,
//                tags: ["group_system_message"],
//                strong_auth_check: false
//              }, function (gotData) {
//
//                data.returns = "ok";
//                process.emit('next', data);
//
//              });
//
//            });
//          } else {
//            data.returns = "ERROR: Invalid secretkey";
//            process.emit('next', data);
//          }
//        });
//      } else {
//        data.returns = "ERROR: Missing data from request.";
//        process.emit('next', data);
//      }
//    }
//  },
  hook_post_message_hub_user: {
    rank: 1,
    event: function (data) {
      if (data.post.apikey && data.post.secretkey && data.post.userids && data.post.content) {
        process.hook('hook_secretkey_check', {
          apikey: data.post.apikey,
          secretkey: data.post.secretkey
        }, function (check) {

          if (check.returns === true) {

            var userids = [];
            var useridsValid = true;
            var useridsSuccess = [];
            try {
              userids = JSON.parse(data.post.userids);
            } catch (e) {
              useridsValid = false;
            }

            var sendMessage = function (groupid, callback) {
              var content = {};

              content.text = data.post.content;

              process.hook('hook_message_add', {
                userid: process.config.systemuser,
                groupid: groupid,
                content: content,
                tags: ["user_system_message"],
                strong_auth_check: false
              }, function (gotData) {
                callback(gotData);
              });
            };

            if (useridsValid && userids.length > 0) {

              var element;
              var index = 0;
              var recurse = function () {

                if (index < userids.length) {

                  element = userids[index];

                  process.hook('hook_db_find', {
                    dbcollection: 'groups',
                    dbquery: {
                      'is121': true,
                      $and: [{
                        'members': {
                          $elemMatch: {
                            'userid': element.toString()
                          }
                        }
                                            }, {
                        'members': {
                          $elemMatch: {
                            'userid': process.config.systemuser.toString()
                          }
                        }
                                            }]
                    }
                  }, function (gotData) {

                    if (gotData.returns && JSON.parse(gotData.returns).length === 0) {
                      // Need to create group
                      process.hook('hook_group_add', {
                        name: 'default',
                        members: [process.config.systemuser.toString(), element.toString()],
                        is121: true
                      }, function (groupid) {
                        if (groupid.success === true) {
                          sendMessage(groupid.returns, function () {
                            useridsSuccess.push(element);
                            index++;
                            recurse();
                          });
                        } else {
                          index++;
                          recurse();
                        }
                      });
                    } else {
                      // Group already exists
                      sendMessage(JSON.parse(gotData.returns)[0]._id, function () {
                        useridsSuccess.push(element);
                        index++;
                        recurse();
                      });

                    }
                  });
                } else {
                  data.returns = "OK, messaged the following users: ";
                  data.returns += JSON.stringify(useridsSuccess);
                  process.emit("next", data);

                  return;
                }
              }

              recurse();


            } else {
              data.returns = "ERROR: No users specified. Invalid JSON?";
              process.emit("next", data);
            }

          } else {
            data.returns = "ERROR: Invalid secretkey";
            process.emit('next', data);
          }
        });
      } else {
        data.returns = "ERROR: Missing data from request.";
        process.emit('next', data);
      }
    }
  },
  // POST /message/add
  hook_post_message_add: {
    rank: 1,
    event: function (data) {

      //Function for adding all messages (with admin check)

      var addmessage = function (admin) {

        var content = {};

        content[data.post.messagetype] = data.post.content;

        process.hook('hook_message_add', {
          'userid': data.post.userid,
          'groupid': data.post.groupid,
          'content': content,
          'tags': [data.post.messagetype],
          strong_auth_check: true
        }, function (gotData) {
          data.returns = JSON.stringify(gotData.returns);
          process.emit('next', data);
        });

      };

      //Check if user is admin

      if (data.post.apikey && data.post.secretkey && (data.post.groupid || data.post.groupref) && data.post.content) {
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
                  'entityref': data.post.gid,
                  'isReadOnly': true
                }
              }, function (groupid) {

                data.post.groupid = JSON.parse(groupid.returns);

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

      if (data.message.content.text) {
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
          data.message.content.text = data.message.content.text
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
