iris.modules.auth.globals.registerPermission("can post to group without membership", "messages")
iris.modules.auth.globals.registerPermission("can bypass group permissions", "messages")

//Validate creation of message

iris.modules.messages.registerHook("hook_entity_validate_message", 0, function (thisHook, entity) {

  var group;
  var member;

  // Validate message contents

  // todo

  // Check group exists

  var checkGroupExists = iris.promise(function (data, yes, no) {

    iris.modules.group_manager.globals.fetchGroupById(entity.groupid).then(function (fetchedGroup) {

      group = fetchedGroup;

      yes(data);

    }, function (fail) {

      no("Group does not exist");

    });

  });

  // Check user is member of group

  var checkMembership = iris.promise(function (data, yes, no) {

    iris.modules.group_manager.globals.checkGroupMembership({
      userid: thisHook.authPass.userid,
      _id: entity.groupid,
    }, thisHook.authPass.userid).then(function (fetchedMember) {

      member = fetchedMember;

      if (!iris.modules.auth.globals.checkPermissions(['can bypass group permissions'], thisHook.authPass)) {

        if (iris.modules.group_manager.globals.checkGroupPermission(group.type, ['can post message'], member.roles)) {

          yes(data);

        } else {

          no("Cannot post to this group due to its permissions");

        }

      } else {

        yes(data);

      }

    }, function (fail) {

      if (!iris.modules.auth.globals.checkPermissions(['can post to group without membership'], thisHook.authPass)) {

        no("Cannot post to groups you are not a member of");

      } else {

        yes(data);

      }

    });

  });

  var pass = function (response) {

    thisHook.finish(true, response);

  }

  var fail = function (response) {

    thisHook.finish(false, response);

  }

  iris.promiseChain([checkGroupExists, checkMembership], entity, pass, fail);

});
