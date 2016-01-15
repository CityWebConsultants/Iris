

iris.modules.chat_groups.registerHook("hook_chat_groups_addmember", 0, function (thisHook, data) {

  // Check userid of member is valid
  if (!(data.member && data.member.userid && typeof data.member.userid === "string")) {

    thisHook.finish(false, "Member not provided, or member does not contain a userid as a string");

  }

  // Fetch requested group
  iris.modules.chat_groups.globals.fetchGroupById(data.group, thisHook.authPass).then(function (found) {

    // Remove chance of adding duplicate user to group
    found[0].members.forEach(function (element) {

      if (element === data.member.userid) {

        thisHook.finish(false, "User is already a member of this group")

      }

    });

    found[0].members.push(data.member.userid);

    iris.hook("hook_entity_edit", "root", null, found[0]).then(function (success) {

      thisHook.finish(true, success);

    }, function (fail) {

      thisHook.finish(false, "Could not edit entity");

    });

  }, function (fail) {

    thisHook.finish(false, "No such group exists");

  });

});

iris.app.post('/groups/addmember', function (req, res) {

  iris.hook('hook_chat_groups_addmember', req.authPass, null, req.body).then(function (pass) {

    res.respond(200, pass);

  }, function (fail) {

    res.respond(500, fail);

  });

});

iris.app.post('/groups/removemember', function (req,res) {

});

iris.modules.chat_groups.registerHook("hook_chat_groups_removemember", 0, function (thisHook, data) {

});
