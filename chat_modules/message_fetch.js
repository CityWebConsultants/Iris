/*jslint node: true nomen: true */
"use strict";

/*  Message Fetch Module
 *  Provides an API endpoint for fetching all messages tied to a particular group.
 *
 *
 */

var objectID = require('mongodb').ObjectID;

// Prepare threaded message

var prepareThreads = function (messages) {

  var rootMessages = [];

  var output = [];

  var sort = function (a, b) {
    if (a.parents.length < b.parents.length) {
      return 1;
    }
    if (a.parents.length > b.parents.length) {
      return -1;
    }
    // a must be equal to b
    return 0;
  };

  messages.forEach(function (element, index) {

    var current = element.parents;

    if (current.length === 1) {
      rootMessages.push(element);
    }

  });

  rootMessages.forEach(function (message, index) {
    var thread = [];

    messages.forEach(function (element, messageIndex) {

      var current;

      current = element.parents;


      element.parents = current;

      if (current.indexOf(message._id) !== -1) {
        thread.push(element);
      }

    });

    thread.sort(sort);

    var getMessageById = function (id) {
      var returns;

      messages.forEach(function(element) {
        if (element._id === id) {
          returns = element;
        }
      });

      return returns;
    };

    thread.forEach(function (flatMessage, messageIndex) {

      // Ignore root
      if (flatMessage.parents.length > 1) {

        var parentMessage = getMessageById(flatMessage.parents[flatMessage.parents.length - 2]);

        if(parentMessage) {

          if (!parentMessage.replies) {
            parentMessage.replies = [];
          }

        parentMessage.replies.push(flatMessage);

        } else {

          console.log("Broken reply chain.");

        }

      }

    });

    output.push(thread[thread.length - 1]);

  });

  return output;

};

var exports = {
  options: {},
  // Create objectID from timestamp for use in 'since' queries.
  objectIDWithTimestamp: function (timestamp) {
    // Convert string date to Date object (otherwise assume timestamp is a date)
    if (typeof (timestamp) === 'string') {
      timestamp = new Date(timestamp);
    }

    // Convert date object to hex seconds since Unix epoch
    var hexSeconds = Math.floor(timestamp / 1000).toString(16),
      constructedObjectID = objectID(hexSeconds + "0000000000000000");

    return constructedObjectID;
  },
  hook_get_fetch_publicmessages: {
    rank: 0,
    event: function (data) {

      var groupids = [];
      var messages = [];
      var groups = {};

      var findMessages = function (data) {

        return new Promise(function(yes, no) {

          var query = {
            'permissions.read': 0
          };

          hook('hook_db_find', {
            dbcollection: 'messages',
            dbquery: query
          }, function (gotData) {

            messages = JSON.parse(gotData.returns);

            messages.forEach(function (element, index) {

              var message = messages[index];

              groupids.push(objectID(message.groupid));

              if (process.usercache[message.userid]) {
                message.usercache = process.usercache[message.userid];
              }

            });

            data.returns = JSON.stringify(messages);

            yes(data);

          });

        });

      };

      var groupDetails = function (data) {

        return new Promise(function(yes, no) {

          hook('hook_db_find', {
            dbcollection: 'groups',
            dbquery: {
              _id: {
                $in: groupids
              }
            }
          }, function (groups) {

            groups = JSON.parse(groups.returns);

            groupids = {};

            groups.forEach(function (element) {
              groupids[element._id] = element;
            });

            yes(data);

          });

        });

      };

      var generateOutput = function (data) {

        return new Promise(function (yes, no) {

          messages.forEach(function (element) {

            var group = groupids[element.groupid];

            element.groupdetails = {
              name: group.name,
              avatar: group.avatar
            };

          });

          data.returns = JSON.stringify(messages);

          yes(data);

        });

      };

      hookPromiseChain([findMessages, groupDetails, generateOutput], data);

    }

  },
  hook_get_fetch_usermessages: {

    rank: 0,
    event: function (data) {

      //Placeholder array for a user's groups
      var groupids = {};

      //Auth check function

      var authCheck = function (data) {

        return new Promise(function (yes, no) {

          hook('hook_auth_check', {
            userid: data.get.userid,
            token: data.get.token
          }, function (authorised) {
            if (authorised.returns === true || (data.get.secretkey === process.config.secretkey && data.get.apikey === process.config.apikey)) {

              yes(data);

            } else {

              no(data);

            }

          });

        })

      };

      //Fetch groups function

      var fetchUserGroups = function (data) {

        return new Promise(function (yes, no) {

          hook('hook_fetch_groups', {
            userid: data.get.userid
          }, function (groups) {

            var groups = JSON.parse(groups.returns);

            //Fetched all groups a user is a member of, now to fetch their messages

            Object.keys(groups).forEach(function (element, index) {

              groupids[groups[element]._id] = groups[element];

            });

            yes(data);

          });

        });

      };

      //Fetch messages from groups (needs array of groupids)

      var fetchMessages = function (data) {

        return new Promise(function (yes, no) {

          //Create database query to fetch messages with

          var query = {};

          query.groupid = {
            $in: Object.keys(groupids)
          };

          hook('hook_db_find', {
            dbcollection: 'messages',
            dbquery: query
          }, function (gotData) {

            var messages = JSON.parse(gotData.returns);

            messages.forEach(function (element, index) {

              var message = messages[index];

              if (process.usercache[message.userid]) {
                message.usercache = process.usercache[message.userid];
              }

              if (groupids[message.groupid]) {

                var group = groupids[message.groupid];

                message.groupdetails = {

                  name: group.name

                }

              }

            });

            messages = prepareThreads(messages);

            data.returns = JSON.stringify(messages);

            yes(data);

          });

        });

      };

      var fail = function (data) {

        data.returns = "Error";
        process.emit('next', data);

      };

      var finish = function (data) {

        process.emit('next', data);

      };

      //GO GO GO!

      authCheck(data)
        .then(fetchUserGroups, fail)
        .then(fetchMessages, fail)
        .then(finish, fail);

    }

  },
  hook_unread: {

    rank: 0,
    event: function (data) {

      hook('hook_auth_check', {
        userid: data.userid,
        token: data.token
      }, function (authorised) {
        if (authorised.returns === true || (data.secretkey === process.config.secretkey && data.apikey === process.config.apikey)) {

          var groups = [],
            groupactivity = {},
            query = {};

          hook('hook_fetch_groups', {
            userid: data.userid
          }, function (group) {
            JSON.parse(group.returns).forEach(function (element) {

              //Loop over all the members of each group and return the last updated time for the current member.
              var lastread = "";

              element.members.forEach(function (member) {

                if (member.userid === data.userid) {

                  if (member.lastviewed) {
                    lastread = member.lastviewed;
                  } else {
                    lastread = '0';
                  }

                }

              });

              groups.push(element._id);
              groupactivity[element._id] = lastread;

            });

            //Loop over the last read times to find the earliest time so the database doesn't have to pull too many messages in

            var earliestmessage = Date.now();

            groups.forEach(function (element) {

              if (groupactivity[element] < earliestmessage) {

                earliestmessage = groupactivity[element];

              }

            });

            query._id = {
              $gt: exports.objectIDWithTimestamp(earliestmessage)
            };

            //Don't load user's own messages

            query.userid = {
              $ne: data.userid
            };

            //Only load messages from the groups the user is part of

            query.groupid = {
              $in: groups
            };

            hook('hook_db_find', {
              dbcollection: 'messages',
              dbquery: query
            }, function (gotData) {

              if (gotData.returns !== '[]') {

                var messages = JSON.parse(gotData.returns),
                  unreadbundle = {};
                data.returns = {};

                //Loop over all returned messages and create a message counter for each group

                messages.forEach(function (element) {

                  // Only add the message if it was received after the group was last checked
                  // or if a date is specified, after that date as well

                  var messagedate = objectID(element._id).getTimestamp(),
                    groupviewed = new Date(groupactivity[element.groupid]);

                  if (messagedate > groupviewed && (!data.date || messagedate > data.date)) {

                    //Create bundle of unread messages for if user requests all of them

                    if (data.messages) {

                      if (!unreadbundle[element.groupid]) {

                        unreadbundle[element.groupid] = {
                          groupid: element.groupid,
                          messages: []
                        };

                      }

                      var tagmatch;

                      if (data.types) {

                        data.types.forEach(function (type, index) {

                          if (element.tags) {

                            element.tags.forEach(function (tag, index) {

                              if (tag === type) {

                                tagmatch = true;

                              }

                            });

                          }

                        });

                      }


                      if (!data.types || tagmatch) {

                        unreadbundle[element.groupid].messages.push(element);

                      }

                    }


                    if (!data.returns[element.groupid]) {
                      data.returns[element.groupid] = 1;
                    } else {
                      data.returns[element.groupid] += 1;
                    }

                  }

                });

                if (data.messages) {

                  //Make pretty message feed for humans

                  var groups = Object.keys(unreadbundle);

                  groups.forEach(function (element, index) {

                    groups[index] = objectID(element);

                  });

                  var query = {};

                  query._id = {
                    $in: groups
                  };

                  hook('hook_db_find', {
                    dbcollection: 'groups',
                    dbquery: query
                  }, function (gotData) {

                    var group;

                    for (group in unreadbundle) {

                      JSON.parse(gotData.returns).forEach(function (element, index) {

                        if (element._id === group) {

                          unreadbundle[group].details = element;

                          unreadbundle[group].members = [];

                          element.members.forEach(function (user, index) {

                            unreadbundle[group].members.push(process.usercache[user.userid]);

                          });

                        }

                      });

                    }

                    data.returns = unreadbundle;
                    process.emit('next', data);
                  });

                } else {

                  process.emit('next', data);

                }


              } else {

                data.returns = "0";
                process.emit('next', data);


              }

            });
          });
        } else {

          data.returns = "error";
          process.emit('next', data);

        }

      });

    }

  },

  hook_get_group_unread: {

    rank: 0,
    event: function (data) {

      if ((data.get.userid && data.get.token) || (data.get.secretkey && data.get.apikey)) {

        hook("hook_unread", data.get, function (unread) {

          data.returns = JSON.stringify(unread.returns);

          process.emit("next", data);

        });

      } else {

        data.returns = "error";
        process.emit("next", data);

      }

    }
  },
  hook_group_list_messages: {

    rank: 0,
    event: function (data) {
      // expects groupid, optional (since)
      var query = {
        groupid: data.groupid
      };
      if (data.since) {
        query._id = {
          $gt: exports.objectIDWithTimestamp(data.since)
        };
      }

      hook('hook_db_find', {
        dbcollection: 'messages',
        dbquery: query
      }, function (gotData) {

        var messages = JSON.parse(gotData.returns);

        messages.forEach(function (element, index) {

          var message = messages[index];

          if (process.usercache[message.userid]) {
            var usercache = {
              username: process.usercache[message.userid].username,
              avatar: process.usercache[message.userid].avatar
            };

            message.usercache = usercache;
          }

        });

        if (data.nested) {
          messages = prepareThreads(messages);
        }

        data.returns = JSON.stringify(messages);
        process.emit('next', data);
      });
    }
  },
  // GET /fetch/group/messages
  hook_get_fetch_group_messages: {
    rank: 0,
    event: function (data) {
      // expects groupid, userid & token, optional (since)
      if (data.get.groupid && data.get.userid && data.get.token) {

        hook('hook_auth_check', {
          userid: data.get.userid,
          token: data.get.token
        }, function (authorised) {
          if (authorised.returns === true) {
            var query = {
              groupid: data.get.groupid
            };

            if (data.get.since && new Date(data.get.since).getTime() > 0) {
              query.since = data.get.since;
            }

            hook("hook_group_list_messages", query, function (gotData) {
              data.returns = gotData.returns;
              process.emit('next', data);
            });
          } else {
            data.returns = "ERROR: Authentication failed.";
            process.emit('next', data);
          }
        });


      } else {
        data.returns = "ERROR: Missing groupid, userid or token";
        process.emit('next', data);
      }

    }
  },
  hook_get_fetch_message: {
    rank: 0,
    event: function (data) {
      // userid, token, messageid
      if (data.get.userid && data.get.token && data.get.messageid && objectID.isValid(data.get.messageid)) {
        hook('hook_auth_check', {
          userid: data.get.userid,
          token: data.get.token
        }, function (authorised) {
          if (authorised.returns === true) {
            hook('hook_groupid_from_messageid', {
              messageid: data.get.messageid
            }, function (groupid) {
              if (groupid.returns) {
                hook('hook_db_find', {
                  dbcollection: 'groups',
                  dbquery: {
                    '_id': objectID(groupid.returns),
                    members: {
                      $elemMatch: {
                        'userid': data.get.userid
                      }
                    }
                  }
                }, function (groupinfo) {
                  if (groupinfo.returns && groupinfo.returns !== '[]') {

                    hook('hook_db_find', {
                      dbcollection: 'messages',
                      dbquery: {
                        '_id': objectID(data.get.messageid)
                      }
                    }, function (message) {
                      data.returns = message.returns;
                      process.emit('next', data);
                    });

                  } else {
                    data.returns = "ERROR: Not authorised to view this message.";
                    process.emit('next', data);
                  }
                });
              } else {
                data.returns = "ERROR: Could not fetch associated group.";
                process.emit('next', data);
              }
            });
          } else {
            data.returns = "ERROR: Authentication failed.";
            process.emit('next', data);
          }
        });
      } else {
        data.returns = "ERROR: Missing messageid, userid or token";
        process.emit('next', data);
      }
    }
  }
};

module.exports = exports;
