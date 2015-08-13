//Validate creation of group

CM.group_manager.registerHook("hook_entity_validate_group", 0, function (thisHook, data) {

  var entity = data.new;
  var past = data.old;

  var typeChecking = C.promise(function (data, yes, no) {

    //Field type checking

    var allowed = {
      "name": "string",
      "entityRef": "string",
      "_id": "string",
      "type": "string",
      "members": "array",
      "is121": "boolean"
    };

    var typeCheck = C.typeCheck(allowed, entity, data);

    if (typeCheck.valid) {
      yes(data);
    } else {
      no("Validation failed for fields: " + JSON.stringify(typeCheck.invalidFields));
    }

  });

  var check121Permission = C.promise(function (data, yes, no) {

    if (!data.is121) {

      yes(data);

    } else {

      if (CM.auth.globals.checkPermissions(["can create 121 group"], thisHook.authPass)) {

        yes(data);

      } else {

        no("Cannot create 121 group");

      };

    }

  });

  var check121Duplicates = C.promise(function (data, yes, no) {

    if (data.is121) {

      if (!data.members || data.members.length !== 2) {

        //Can't do a check for a 121 as no members were supplied. Must be a new group or an update.

        no("One to one groups have to have two members");
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

          if (!data._id) {

            no("Group already exists");

          } else {

            yes(data);

          }


        } else {

          yes(data);

        }

      })

    } else {

      yes(data);

    }

  })

  var checkEntityRefPermission = C.promise(function (data, yes, no) {

    if (!data.entityRef) {

      yes(data);

    } else {

      if (CM.auth.globals.checkPermissions(["can create group with entityref"], thisHook.authPass)) {

        yes(data);

      } else {

        no("Cannot create group with entityref");

      };

    }

  });

  var noEntityRefand121 = C.promise(function (data, yes, no) {

    if (data.is121 && data.entityRef) {

      no("Cannot have both entityRef and 121");

    } else {

      yes(data);

    }

  });

  var pass = function (data) {

    thisHook.finish(true, data);

  }

  var fail = function (data) {

    thisHook.finish(false, data);

  }

  C.promiseChain([typeChecking, check121Permission, check121Duplicates, checkEntityRefPermission], entity, pass, fail);

});
