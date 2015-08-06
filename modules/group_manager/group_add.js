CM.group_manager.registerHook("hook_group_add", 0, function (thisHook, data) {

  //Error checking on submitted data


  if (data.is121 && data.entityRef) {

    thisHook.finish(false, "Group cannot have an entity reference if it is a one-to-one conversation");
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

        C.dbCollections.group.findOne({
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

            no("Database error");

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

      if (data.entityRef) {
        //Update if a group with that entity ref already exists, insert new group otherwise

        C.dbCollections.group.findOne({
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

    return new Promise(function (yes, no) {

      if (data._id) {

        C.dbCollections.group.findOne({
          _id: data._id
        }, function (err, foundGroup) {

          if (err) {

            data.errors.push("Database error");
            no(err);

          } else if (foundGroup) {

            //Check if admin and allow pass through if yes

            if (CM.auth.globals.checkPermissions(["can bypass group permissions"], thisHook.authPass)) {

              yes(data);
              return true

            }

            //Group already exists with that ID

            //Check user is actually a member of this group or is an admin

            var updatingMember;

            //Find the member in the group

            foundGroup.members.forEach(function (member, index) {

              if (data.userid === member.userid) {

                updatingMember = member;

              }

            });

            if (!updatingMember) {

              no("Not a member of the group you are trying to update");
              return false;

            };

            //Check if user has top level update group permission

            if (CM.auth.globals.checkPermissions(["can update group"], thisHook.authPass)) {

              yes(data);
              return true;

            }

            //If not, check user's roles within a group for the update group permission

            if (!CM.group_manager.globals.checkGroupPermission(foundGroup.permissions, ["can update group"], updatingMember.roles)) {

              no("Not allowed to update this group");
              return false;

            };

            yes(data);

          } else {

            no("Group doesn't exist yet _ID was supplied");

          }

        });

      } else {

        yes(data);

      }


    });

  }

  var dbWrite = function (data) {

    return new Promise(function (yes, no) {

        var allowed = ["name", "entityRef", "_id", "type", "members", "is121"];

        var group = {};

        //Add allowed properties to group object if present

        Object.keys(data).forEach(function (element) {

          if (allowed.indexOf(element) !== -1) {

            group[element] = data[element];

          }

        });

        if (!group._id) {

          //Adding a new group

          //Check if user can add a new group

          if (!CM.auth.globals.checkPermissions(["can create group"], thisHook.authPass)) {

            no("Can't create group");
            return false;

          }

          //Check if new group has an entity ref. If yes, check if user has permission to access it

          if (group.entityRef) {

            if (!CM.auth.globals.checkPermissions(["can create group with entityRef"], thisHook.authPass)) {

              no("Can't create group with entitiyRef");
              return false;

            }

          }

          //Check if userid is in members

          if (!CM.auth.globals.checkPermissions(["can create group without self"], thisHook.authPass)) {

            var valid = false;

            group.members.forEach(function (element) {

              if (data.userid === element.userid) {

                valid = true;

              }

            });

            if (!valid) {

              no("Can't create a group you're not a member of");
              return false;

            };

          }

          if (group.is121) {

            if (!CM.auth.globals.checkPermissions(["can create 121 group"], thisHook.authPass)) {

              no("Can't create 121 group");
              return false;

            }

            if (group.members && group.members.length === 2 && group.members[0].userid !== group.members[1].userid) {

              //Valid 121 group

            } else {

              //Not a valid 121 group

              no("Not a valid 121 group");
              return false;

            }

          }

          var group = new C.dbCollections.group(group);

          group.save(function (err, doc) {

            if (err) {

              console.log(err);
              no("Database error");

            } else if (doc) {

              yes(doc);

            }

          });

        } else {

          if (group.entityRef) {

            //Can't change group entity ref

            delete group.entityRef;

          }

          if (group.is121) {

            if (group.members) {

              //Can't update members in 121 group

              delete group.members;

            }

          }

          C.dbCollections.group.findOneAndUpdate({
              _id: data._id
            },
            group, {
              upsert: true,
              new: true
            },
            function (err, doc) {

              if (err) {

                console.log("err");
                no("Database error");

              } else {

                yes(doc);

              }

            })

        }

      }

    )
  };

  var success = function (data) {

    thisHook.finish(true, data);

  };

  var fail = function (data) {

    thisHook.finish(false, data);

  };

  C.promiseChain([check1to1, checkEntityRef, checkId, dbWrite], data, success, fail);

});

C.app.post('/group/add', function (req, res) {

  var allowed = ["name", "entityRef", "_id", "type", "members", "is121", "userid"];

  var send = {};

  //Add allowed properties to group object if present

  Object.keys(req.body).forEach(function (element) {

    if (allowed.indexOf(element) !== -1) {

      send[element] = req.body[element];

    }

  });

  C.hook("hook_group_add", send, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});
