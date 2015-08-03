/*jslint node: true nomen: true*/
"use strict";

/*  Group Manager Module
 *
 *  Provides an essential group management system. Provides hooks for creating and editing groups.
 *  All user interactions take place in the context of a group.
 *
 *  Core hooks:
 *  hook_group_list_users
 *  hook_group_update
 *
 *  API endpoints:
 *  /fetch/group/users
 *  /fetch/groups
 *  /debug/groups
 *  /group/add
 *  /group/update/addmember
 *  /group/update/removemember
 *  /group/update/name
 */

var groupTypes = require(process.config.moduleConfigPath + 'group_manager' + '/group_types.js');

//var mongoClient = require('mongodb').MongoClient;
var objectID = require('mongodb').ObjectID;

//Translate default name to list of users (not including current user)

var defaultname = function (members, userid) {

  var name = "";

  if (members.length > 1) {
    members.forEach(function (element, index) {

      if (element.uid) {

        element.userid = element.uid;

      }

      if (process.usercache[element.userid] && element.userid !== userid) {

        name += process.usercache[element.userid].username;
        name += ", ";

      }

    });

    // Trim last comma from the end.
    name = name.slice(0, -2);

  } else {
    if (process.usercache[userid]) {
      name = process.usercache[userid].username;
    }
  }

  return name;

};

process.defaultname = defaultname;

var getavatar = function (group, userid) {

  if (group.is121) {
    var avatar;
    group.members.forEach(function (element, index) {
      if (element.userid != userid) {
        if (process.usercache[element.userid] && process.usercache[element.userid].avatar) {
          avatar = process.usercache[element.userid].avatar;
        }
      }
    });

    if (!avatar) {
      avatar = null;
    }

    return avatar;
  } else if (group.entityref) {
    var avatar;
    if (group.avatar) {
      avatar = group.avatar;
    } else {
      avatar = null;
    }

    return avatar;
  } else {
    return null;
  }
}

var exports = {
  options: {
    allowdebug: false
  },


  dbModels: {

    group: {}

  },

  dbSchemaFields: {

    group: {

      name: {
        type: String,
        required: true
      },
      members: [{
        _id: false,
        userid: {
          type: String,
          required: true,
        },
        roles: [String],
        lastUpdated: {
          type: Date,
          required: false
        },
        joined: {
          type: Date,
          required: false
        }
      }],
      entityRef: {
        type: String,
        required: false,
        unique: true
      },
      permissions: {

        read: {
          type: Number,
          required: true
        },
        write: {
          type: Number,
          required: true
        },
        update: {
          type: Number,
          required: true
        }

      },
      is121: {
        type: Boolean,
        required: true
      }
    }
  },
  globals: {
    isGroupMember: function (userid, groupid, callback) {

      // Call db find hook.
      hook('hook_db_find', {
        dbcollection: 'groups',
        dbquery: {
          'members': {
            '$elemMatch': {
              'userid': userid
            }
          },
          '_id': objectID(groupid)
        }
      }, function (gotData) {

        if (gotData.returns) {

          callback(true);

        } else {

          callback(false);

        }

      })
    }
  },
  // TODO: this module needs refactoring methinks. but hey, it does work.
  hook_get_fetch_group: {
    rank: 0,
    event: function (data) {
      hook('hook_fetch_group', {
        userid: data.get.userid,
        token: data.get.token,
        groupid: data.get.groupid
      }, function (gotData) {
        data.returns = JSON.stringify(gotData.returns);
        process.emit('next', data);
      });
    }
  },
  hook_fetch_group: {
    rank: 0,
    event: function (data) {
      if (data.userid && data.token && data.groupid) {

        // Check objectID valid
        try {
          data.groupid = objectID(data.groupid);
        } catch (e) {
          data.returns = "ERROR: Bad ObjectID";
          process.emit("next", data);
          return false;
        }

        // Promise functions

        var dbFind = function (data) {
          return new Promise(function (yes, no) {
            // Call db find hook.
            hook('hook_db_find', {
              dbcollection: 'groups',
              dbquery: {
                members: {
                  $elemMatch: {
                    'userid': data.userid
                  }
                },
                '_id': data.groupid
              }
            }, function (gotData) {

              var groupdata = JSON.parse(gotData.returns);

              groupdata.forEach(function (element, index) {
                if (element.name === 'default') {
                  groupdata[index].name = defaultname(element.members, data.userid);
                }

                groupdata[index].avatar = getavatar(element, data.userid);
              });

              data.returns = groupdata;

              yes(data);

            });

          });
        };

        hookPromiseChain([C.auth.authCheck, dbFind], data);

      } else {
        data.returns = "ERROR: Missing userid, token or groupid.";
        process.emit('next', data);
      }
    }
  },
  hook_group_list_users: {
    rank: 0,
    event: function (data) {

      if (objectID.isValid(data.groupid)) {
        var groupid = data.groupid,
          userid = data.userid, // optional: only return results that include this user
          query = {
            '_id': objectID(groupid)
          };

        if (userid) {
          query = {
            '_id': objectID(groupid),
            members: {
              $elemMatch: {
                'userid': data.userid.toString()
              }
            }
          };
        }

        hook('hook_db_find', {
            dbcollection: 'groups',
            dbquery: query
          },
          function (gotData) {
            if (gotData.returns && JSON.parse(gotData.returns)[0]) {
              data.returns = JSON.parse(gotData.returns)[0].members;

              data.returns.forEach(function (element, index) {

                var property;

                for (property in process.usercache[element.userid]) {


                  data.returns[index][property] = process.usercache[element.userid][property];


                }
              });

              process.emit('next', data);
            } else {
              console.log("[INFO] hook_group_list_users: Request for nonexistent or inaccessible group ID");
              data.returns = false;
              process.emit('next', data);
            }
          });
      } else {
        console.log("[INFO] hook_group_list_users: Request for bad ObjectID");
        data.returns = false;
        process.emit('next', data);
      }
    }
  },
  // GET /fetch/group/users
  hook_get_fetch_group_users: {
    rank: 0,
    event: function (data) {
      if (data.auth > 0) {
        var groupid = data.get.groupid;

        if (objectID.isValid(data.get.groupid)) {
          hook('hook_group_list_users', {
              'groupid': groupid,
              'userid': data.get.userid
            },
            function (gotData) {
              if (typeof gotData.returns !== 'string') {
                data.returns = JSON.stringify(gotData.returns);
              } else {
                data.returns = gotData.returns;
              }
              process.emit('next', data);
            });
        } else {
          data.returns = "ERROR: Invalid group ID.";
          process.emit('next', data);
        }
      } else {
        data.returns = "ERROR: Authentication failed.";
        process.emit('next', data);
      }
    }
  },
  // POST /group/add
  hook_post_group_add: {
    rank: 0,
    event: function (data) {

      var allowed = ["name", "entityRef", "_id", "permissions", "members", "is121"];

      var send = {};

      //Add allowed properties to group object if present

      Object.keys(data.post).forEach(function (element) {

        if (allowed.indexOf(element) !== -1) {

          send[element] = data.post[element];

        }

      });

      //Add auth value to object to check permissions

      send.auth = data.auth;

      //Add userid value if present to check permissions

      send.userid = data.post.userid;

      var addGroup = function () {

        return new Promise(function (yes, no) {

          hook("hook_group_add", send, function (groupid) {

            data.returns = groupid.returns.toString();
            yes(data);

          });

        });

      };

      hookPromiseChain([addGroup], data);

    }

  },
  hook_group_add: {
    rank: 0,
    event: function (data) {

      //Error checking on submitted data

      if (data.is121 && data.entityRef) {

        data.returns = "Group cannot have an entity reference if it is a one-to-one conversation";
        process.emit("next", data);
        return false;

      }

      //Check if 1to1 group and, if so, check if it doesn't already exist.

      var check1to1 = function (data) {

        return new Promise(function (yes, no) {

          if (data.is121) {

            if (!data.members || data.members.length !== 2) {

              //Can't do a check for a 121 as no members were supplied. Must be a new group or an update.

              yes(data);
              return false;

            };

            var groupsModel = C.dbModels.group_manager.group;

            groupsModel.findOne({
              'is121': true,
              '$and': [{
                'members': {
                  '$elemMatch': {
                    'userid': data.members[0].userid
                  }
                }
                }, {
                'members': {
                  '$elemMatch': {
                    'userid': data.members[1].userid
                  }
                }
                }]
            }, "_id", function (err, doc) {

              if (err) {

                data.errors.push("Database error");
                no(data);

              }

              if (doc) {

                data._id = doc._id;
                yes(data);

              } else {

                yes(data);

              }

            })

          } else {

            yes(data);

          }

        });

      };

      var checkEntityRef = function (data) {

        return new Promise(function (yes, no) {

          var groupModel = C.dbModels.group_manager.group;

          if (data.entityRef) {
            //Update if a group with that entity ref already exists, insert new group otherwise

            groupModel.findOne({
              entityRef: data.entityRef
            }, function (err, doc) {

              if (err) {

                data.errors.push(err);
                no(data);

              } else if (doc) {

                data._id = doc._id;
                yes(data);

              } else {

                yes(data);

              }

            });

          } else {

            yes(data);

          }

        });

      }

      var checkId = function (data) {

        var groupModel = C.dbModels.group_manager.group;

        return new Promise(function (yes, no) {

          if (data._id) {

            groupModel.findOne({
              _id: data._id
            }, function (err, foundGroup) {

              if (err) {

                data.errors.push("Database error");
                no(err);

              } else if (foundGroup) {
                
                //Check if admin and allow pass through if yes

                if (C.auth.checkPermissions("can bypass group permissions", data.auth)) {

                  yes(data);
                  return true

                }

                //Check group permissions object for update property

                var update = foundGroup.permissions;

                //Group already exists with that ID

                //Check user is actually a member of this group or is an admin

                if (!data.auth || data.auth < 2) {

                  var valid = false;

                  foundGroup.members.forEach(function (element) {

                    if (data.userid === element.userid) {

                      valid = true;

                    }

                  });

                  //Check permissions of group add up to member

                  if (!valid) {

                    data.errors.push("Not allowed to update the group");
                    no(data);
                    return false;

                  };

                }

                yes(data);

              } else {

                data.errors.push("Group doesn't exist yet _ID was supplied");
                no(data);

              }

            });

          } else {

            yes(data);

          }


        });

      }

      var dbWrite = function (data) {

        return new Promise(function (yes, no) {

            var allowed = ["name", "entityRef", "_id", "permissions", "members", "is121"];

            var group = {};

            //Add allowed properties to group object if present

            Object.keys(data).forEach(function (element) {

              if (allowed.indexOf(element) !== -1) {

                group[element] = data[element];

              }

            });

            var groupModel = C.dbModels.group_manager.group;

            if (!group._id) {

              //Adding a new group

              //Check if user can add a new group

              if (!C.auth.checkPermissions(["can create group"], data.auth)) {

                data.errors.push("Can't create group");
                no(data);
                return false;

              }

              //Check if new group has an entity ref. If yes, check if user has permission to access it

              if (group.entityRef) {

                if (!C.auth.checkPermissions(["can create group with entityRef"], data.auth)) {

                  data.errors.push("Can't create group with entitiyRef");
                  no(data);
                  return false;

                }

              }

              //Check if userid is in members

              if (!C.auth.checkPermissions(["can create group without self"], data.auth)) {

                var valid = false;

                group.members.forEach(function (element) {

                  if (data.userid === element.userid) {

                    valid = true;

                  }

                });

                if (!valid) {

                  data.errors.push("Can't create a group you're not a member of");
                  no(data);
                  return false;

                };

              }

              if (group.is121) {

                if (!C.auth.checkPermissions(["can create 121 group"], data.auth)) {

                  data.errors.push("Can't create 121 group");
                  no(data);
                  return false;

                }

                if (group.members && group.members.length === 2 && group.members[0].userid !== group.members[1].userid) {

                  //Valid 121 group

                } else {

                  //Not a valid 121 group

                  data.errors.push("Not a valid 121 group");
                  no(data);
                  return false;

                }

              }

              var group = new groupModel(group);

              group.save(function (err, doc) {

                if (err) {

                  data.errors.push("Database error");
                  no(data);

                } else if (doc) {

                  data.returns = doc;
                  yes(data);

                }

              });

            } else {

              if (group.is121) {

                if (group.members) {

                  //Can't update members in 121 group

                  delete group.members;

                }

              }

              groupModel.findOneAndUpdate({
                  _id: data._id
                },
                group, {
                  upsert: true,
                  new: true
                },
                function (err, doc) {

                  if (err) {

                    data.errors.push(err);
                    no(data);

                  } else {

                    data.returns = doc;
                    yes(data);

                  }

                })

            }

          }

        )
      };

      hookPromiseChain([check1to1, checkEntityRef, checkId, dbWrite], data);

    }

  },
  hook_get_fetch_groups: {
    rank: 0,
    event: function (data) {

      if (data.get.userid && data.get.token) {

        if (data.auth > 0) {
          hook('hook_fetch_groups', {
            userid: data.get.userid
          }, function (groups) {
            data.returns = groups.returns;
            process.emit('next', data);
          });
        } else {
          data.returns = "ERROR: Authentication failed.";
          process.emit('next', data);
        }

      } else {
        data.returns = "ERROR: Missing userid or token.";
        process.emit('next', data);
      }
    }
  },
  hook_fetch_groups: {
    rank: 0,
    event: function (data) {
      if (data.userid) {

        // Call db find hook.
        hook('hook_db_find', {
          dbcollection: 'groups',
          dbquery: {
            members: {
              $elemMatch: {
                'userid': data.userid
              }
            }
          }
        }, function (gotData) {
          var groupdata = JSON.parse(gotData.returns);

          groupdata.forEach(function (element, index) {
            if (element.name === 'default') {
              groupdata[index].name = defaultname(element.members, data.userid);
            }

            groupdata[index].avatar = getavatar(element, data.userid);
          });

          data.returns = JSON.stringify(groupdata);

          process.emit('next', data);
        });

      }
    }
  },
  hook_group_update: {
    rank: 0,
    event: function (data) {

      var query;
      if (data.userid) {
        query = {
          '_id': objectID(data.groupid),
          $or: [{
            'is121': false
                    }, {
            'is121': {
              $exists: false
            }
                    }],
          members: {
            $elemMatch: {
              'userid': data.userid.toString()
            }
          }
        };
      } else {
        if (data.groupid) {
          query = {
            '_id': objectID(data.groupid)
          };
        } else if (data.reftype === 'event') {
          query = {
            'reftype': 'event',
            'entityref': data.entityref
          };
        }
        data.userid = 0;
      }

      if (data.action === 'addmember') {

        var addquery = {
          members: {
            $elemMatch: {
              'userid': data.members
            }
          }
        }

        if (data.groupid) {
          addquery['_id'] = objectID(data.groupid);
        } else {
          addquery['reftype'] = data.reftype;
          addquery['entityref'] = data.entityref;
        }

        hook('hook_db_find', {
          dbcollection: 'groups',
          dbquery: addquery
        }, function (existing) {

          // If this user doesn't yet exist
          if (existing.returns && existing.returns === '[]') {

            hook('hook_db_update', {
              dbcollection: 'groups',
              dbquery: query,
              dbupdate: {
                $push: {
                  members: {
                    'userid': data.members,
                    'joined': Date.now()
                  }
                }
              },
              dbmulti: true,
              dbupsert: false
            }, function (gotData) {
              data.returns = gotData.returns;

              // Put a message into the group directly

              hook("hook_send_joined_message", {
                userid: data.userid,
                members: data.members,
                groupid: data.groupid
              }, function (gotData) {
                process.emit("next", data);
              });

            });

          } else {
            data.returns = 'ERROR: That user is already present in the group.';
            process.emit('next', data);
          }

        });

      } else if (data.action === 'removemember') {

        hook('hook_db_update', {
          dbcollection: 'groups',
          dbquery: query,
          dbupdate: {
            $pull: {
              members: {
                'userid': data.members
              }
            }
          },
          dbmulti: true,
          dbupsert: false
        }, function (gotData) {

          data.removedmember = data.members;

          data.returns = gotData.returns;
          process.emit('next', data);
        });

      } else if (data.action === 'name') {
        hook('hook_db_update', {
          dbcollection: 'groups',
          dbquery: query,
          dbupdate: {
            $set: {
              name: data.name
            }
          },
          dbmulti: false,
          dbupsert: false
        }, function (gotData) {
          data.returns = gotData.returns;
          process.emit('next', data);
        });

      } else {
        data.returns = false;
        process.emit('next', data);

      }
    }
  },
  // POST /group/update/addmember
  hook_post_group_update_addmember: {
    rank: 0,
    event: function (data) {

      if (data.post.members && (data.post.groupid && objectID.isValid(data.post.groupid)) || (data.post.entityref && data.post.reftype)) {

        if (data.post.apikey && data.post.secretkey) {
          hook('hook_secretkey_check', {
            apikey: data.post.apikey,
            secretkey: data.post.secretkey
          }, function (valid) {
            if (valid.returns === true) {

              var updatequery = {
                action: 'addmember',
                userid: data.post.userid,
                members: data.post.members
              };

              if (data.post.reftype === 'event') {
                updatequery['reftype'] = data.post.reftype;
                updatequery['entityref'] = data.post.entityref;
              } else {
                updatequery['groupid'] = data.post.groupid;
              }

              hook('hook_group_update',
                updatequery,
                function (gotData) {
                  data.returns = gotData.returns;
                  process.emit('next', data);
                });

            } else {
              data.returns = "ERROR: Secret key incorrect";
              process.emit('next', data);
            }
          });
        } else {
          if (data.auth > 0) {

            hook('hook_group_update', {
              action: 'addmember',
              userid: data.post.userid,
              members: data.post.members,
              groupid: data.post.groupid
            }, function (gotData) {
              data.returns = gotData.returns;
              process.emit('next', data);
            });

          } else {
            data.returns = "ERROR: Authentication failed.";
            process.emit('next', data);
          }

        }
      } else {
        data.returns = "ERROR: Invalid userid or groupid.";
        process.emit('next', data);
      }
    }
  },
  // POST /group/update/removemember
  hook_post_group_update_removemember: {
    rank: 0,
    event: function (data) {

      if (data.post.members && data.post.groupid && objectID.isValid(data.post.groupid)) {

        if (data.post.apikey && data.post.secretkey) {
          hook('hook_secretkey_check', {
            apikey: data.post.apikey,
            secretkey: data.post.secretkey
          }, function (valid) {
            if (valid.returns === true) {

              hook('hook_group_update', {
                action: 'removemember',
                members: data.post.members,
                userid: data.post.userid,
                groupid: data.post.groupid
              }, function (gotData) {
                data.returns = gotData.returns;
                process.emit('next', data);
              });

            } else {
              data.returns = "ERROR: Secret key incorrect";
              process.emit('next', data);
            }
          });
        } else {
          if (data.auth > 0) {

            hook('hook_group_update', {
              action: 'removemember',
              members: data.post.members,
              userid: data.post.userid,
              groupid: data.post.groupid
            }, function (gotData) {
              data.returns = gotData.returns;
              process.emit('next', data);
            });
          } else {
            data.returns = "ERROR: Authentication failed.";
            process.emit('next', data);
          }

        }
      } else {
        data.returns = "ERROR: Invalid userid or groupid.";
        process.emit('next', data);
      }
    }
  },
  // POST /group/update/name
  hook_post_group_update_name: {
    rank: 0,
    event: function (data) {

      if (data.post.name && data.post.groupid && objectID.isValid(data.post.groupid)) {

        if (data.post.apikey && data.post.secretkey) {
          hook('hook_secretkey_check', {
            apikey: data.post.apikey,
            secretkey: data.post.secretkey
          }, function (valid) {
            if (valid.returns === true) {

              hook('hook_group_update', {
                action: 'name',
                name: data.post.name,
                groupid: data.post.groupid,
                userid: data.post.userid
              }, function (gotData) {
                data.returns = gotData.returns;
                process.emit('next', data);
              });

            } else {
              data.returns = "ERROR: Secret key incorrect";
              process.emit('next', data);
            }
          });
        } else {
          if (data.auth > 0) {

            hook('hook_group_update', {
              action: 'name',
              name: data.post.name,
              groupid: data.post.groupid,
              userid: data.post.userid
            }, function (gotData) {
              data.returns = gotData.returns;
              process.emit('next', data);
            });

          } else {
            data.returns = "ERROR: Authentication failed.";
            process.emit('next', data);
          }

        }

      } else {
        data.returns = "ERROR: Invalid new name or groupid.";
        process.emit('next', data);
      }
    }
  },
  hook_post_group_remove: {
    rank: 0,
    event: function (data) {
      // only works for read-only groups
      // secret key, groupid

      if (data.post.apikey && data.post.secretkey && data.post.groupid && objectID.isValid(data.post.groupid)) {
        hook('hook_secretkey_check', {
          apikey: data.post.apikey,
          secretkey: data.post.secretkey
        }, function (valid) {
          if (valid.returns === true) {

            // Delete the group in the database
            hook('hook_db_remove', {
              dbcollection: 'groups',
              dbquery: {
                '_id': objectID(data.post.groupid),
              }
            }, function (deleteReturns) {
              data.returns = deleteReturns.returns;
              process.emit('next', data);
            });

          } else {
            data.returns = "ERROR: Secret key incorrect";
            process.emit('next', data);
          }

        });

      } else {
        data.returns = "ERROR: Missing secret key or groupid.";
        process.emit('next', data);
      }
    }
  },
  hook_groupid_from_messageid: {
    rank: 0,
    event: function (data) {
      var messageid = objectID(data.messageid);

      hook('hook_db_find', {
        dbcollection: 'messages',
        dbquery: {
          '_id': messageid
        }
      }, function (gotData) {
        try {
          data.returns = JSON.parse(gotData.returns)[0].groupid;
        } catch (err) {
          console.log('invalid messageid?');
        }
        process.emit('next', data);
      });
    }
  },
  hook_post_group_121upsert: {
    rank: 0,
    event: function (data) {

      if (data.post.userids && data.post.userid && data.post.apikey && data.post.secretkey) {
        hook('hook_secretkey_check', {
          apikey: data.post.apikey,
          secretkey: data.post.secretkey
        }, function (check) {

          if (check.returns === true) {

            var userids;
            try {
              userids = JSON.parse(data.post.userids);
            } catch (err) {
              data.returns = "ERROR: Bad list of userids.";
              process.emit("next", data);
              return;
            }

            hook("hook_db_find", {
              dbcollection: 'groups',
              dbquery: {
                'is121': true,
                "members": {
                  $all: [{
                    $elemMatch: {
                      "userid": data.post.userid
                    }
                  }, {
                    $elemMatch: {
                      "userid": {
                        "$in": userids
                      }
                    }
                  }]
                }
              }
            }, function (groups) {
              groups = JSON.parse(groups.returns);

              var existing121users = [];

              var returngroups = [];

              groups.forEach(function (element, index) {

                element.members.forEach(function (member) {

                  if (member.userid.toString() !== "1") {
                    existing121users.push(member.userid);
                    returngroups.push(element._id);
                  }

                });

              });

              var userstocreate = userids.filter(function (i) {
                return existing121users.indexOf(i) === -1;
              });

              if (userstocreate.length > 0) {

                userstocreate.forEach(function (user, index, array) {

                  hook('hook_group_add', {
                    name: 'default',
                    members: [user, data.post.userid],
                    is121: true
                  }, function (newgroupid) {

                    if (newgroupid.success === true) {

                      returngroups.push(newgroupid.returns);

                      if (index === array.length - 1) {
                        data.returns = JSON.stringify(returngroups);
                        process.emit("next", data);
                      }

                    }

                  });

                });

              } else {

                data.returns = JSON.stringify(returngroups);
                process.emit("next", data);

              }

            });

          } else {

            //Authentication failed
            data.returns = "ERROR: Invalid secretkey.";
            process.emit("next", data);

          }

        });

      } else {

        //Wrong details sent
        data.returns = "ERROR: Missing parameters.";
        process.emit("next", data);

      }

    }

  }

};

module.exports = exports;
