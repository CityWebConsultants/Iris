iris.registerModule('chat_groups');

iris.modules.chat_groups.globals.fetchGroupById = function (groupid) {

  return new Promise(function (yes, no) {

    iris.hook("hook_entity_fetch", thisHook.authPass, null, {
      queryList: [{
        entities: ['group'],
        queries: [{
          field: 'eid',
          operator: 'IS',
          value: groupid
          }]
      }]
    }).then(function (result) {

      yes(result);

    }, function (fail) {

      no();

    });

  });

};

iris.modules.chat_groups.globals.checkMembership = function (groupid, memberid) {

  return new Promise(function (yes, no) {

    iris.hook("hook_entity_fetch", thisHook.authPass, null, {
      queryList: [{
        entities: ['group'],
        queries: [{
          field: 'eid',
          operator: 'IS',
          value: groupid
          }]
      }]
    }).then(function (result) {

      var memberFound = false;

      result.members.forEach(function (element) {

        if (element.userid === memberid) {

          memberFound = true;

        }

      })

      yes(memberFound);

    }, function (fail) {

      no();

    });

  });

}
