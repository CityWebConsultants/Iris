//Register add member hook and post call to send to it

CM.group_manager.registerHook("hook_group_manager_addmember", 0, function (thisHook, data) {

  //First check if group exists

  //Placeholder for group

  var group = {}
  CM.group_manager.globals.fetchGroupById(data._id).then(function (found) {

    group = found;

  }, function (fail) {

    thisHook.finish(false, "No such group");

  });

  var checkPermission = C.promise(function (data, yes, no) {

    CM.group_manager.globals.checkGroupMembership({
      _id: data._id,
      userid: thisHook.authPass.userid
    }, thisHook.authPass.userid).then(function (member) {

      if (!CM.group_manager.globals.checkGroupPermission(group.type, ["can add member"], member.roles)) {

        no("Not allowed to add group member");

      } else {

        //Allowed to add to group (should also check general user roles here

        yes(data);

      }

    }, function (fail) {

      //Check if user can add members to a group they aren't a member of

      if (CM.auth.globals.checkPermissions(["can add member to group without membership"], thisHook.authPass)) {

        yes(data);

      } else {

        no("Cannot add member to group you aren't a member of");

      };

    });

  });

  var checkDuplicates = C.promise(function (data, yes, no) {

    CM.group_manager.globals.checkGroupMembership({
      _id: data._id,
      userid: data.member.userid
    }, thisHook.authPass.userid).then(function (member) {

      no("Member already exists");

    }, function (nomember) {

      yes(data);

    });

  });

  var addMember = C.promise(function (data, yes, no) {

    C.dbCollections.group.update({
      "_id": data._id
    }, {
      $addToSet: {
        members: data.member
      }
    }, function (err, doc) {

      if (err) {

        no("database error");

      } else if (doc) {

        yes("member added");

      }

    });

  });

  var fail = function (fail) {

    thisHook.finish(false, fail);

  };

  var pass = function (success) {

    thisHook.finish(true, success);

  };

  C.promiseChain([checkPermission, checkDuplicates, addMember], data, pass, fail);

});

C.app.post("/group/addmember", function (req, res) {

  C.hook("hook_group_manager_addmember", req.body, req.authPass).then(function (pass) {

    res.send(pass);

  }, function (fail) {

    res.send(fail);

  });

});
