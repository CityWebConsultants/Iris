//Validate creation of message

CM.messages.registerHook("hook_entity_validate_message", 0, function (thisHook, data) {

  var entity = data.new;

  var group;
  var member;

  // Validate message contents

  // todo

  // Check group exists

  var checkGroupExists = C.promise(function (data, yes, no) {

    CM.group_manager.globals.fetchGroupById(entity.groupid).then(function (fetchedGroup) {

      group = fetchedGroup;

      yes(data);

    }, function (fail) {

      no("Group does not exist");

    });

  });

  // Check user is member of group

  var checkMembership = C.promise(function (data, yes, no) {

    CM.group_manager.globals.checkGroupMembership({
      userid: thisHook.authPass.userid,
      _id: entity.groupid,
    }, thisHook.authPass.userid).then(function (fetchedMember) {

      member = fetchedMember;

      if (!CM.auth.globals.checkPermissions(['can bypass group permissions'], thisHook.authPass)) {

        if (CM.group_manager.globals.checkGroupPermission(group.type, ['can post message'], member.roles)) {

          yes(data);

        } else {

          no("Cannot post to this group due to its permissions");

        }

      } else {

        yes(data);

      }

    }, function (fail) {

      if (!CM.auth.globals.checkPermissions(['can post to group without membership'], thisHook.authPass)) {

        no("Cannot post to groups you are not a member of");

      } else {

        yes(data);

      }

    });

  });

  var pass = function (response) {

    thisHook.finish(true, data);

  }

  var fail = function (response) {

    thisHook.finish(false, data);

  }

  C.promiseChain([checkGroupExists, checkMembership], entity, pass, fail);

});
