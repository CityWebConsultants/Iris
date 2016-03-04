
/**
 * @file groups.js This module handles group, message and user management.
 */

// Add a member to a group
// Below is depreciated. Saving as it may yet be useful
/*iris.route.post("/groups/addMember/:groupid/:member/:entityType/:entityField", function (req, res) {

 var fetch = {
 entities: ["group"],
 queries: [{
 field: "eid",
 "operator": "is",
 "value": parseInt(req.params.groupid)
 }]
 }

 iris.invokeHook("hook_entity_fetch", req.authPass, null,
 fetch
 ).then(function (groupResult) {

 if (groupResult.length) {

 var exists = false;
 for (var i = 0; i < groupResult[0].field_users; i++) {
 if (groupResult[0].field_users[i].field_uid == req.params.member) {
 exists = true;
 }
 }
 if (exists) {

 res.status(400).send("Member already in group");

 }
 else {

 // Check if user exists on system

 var fetch = {
 entities: [req.params.entityType],
 queries: [{
 field: req.params.entityField,
 "operator": "is",
 "value": parseInt(req.params.member)
 }]
 }

 iris.invokeHook("hook_entity_fetch", req.authPass, null, fetch).then(function (userResult) {

 if (userResult.length) {

 // If current group is has only 2 members, create new groups. Otherwise, add to current group.

 var fieldSplit = req.params.entityField.split('.');
 if (groupResult[0].fieldSplit[0].length == 2) {
 var newGroup = groupResult[0];
 var obj = {};
 obj[fieldSplit[1]] = userResult[0][fieldSplit[1]];
 newGroup[fieldSplit[0]].push(obj);

 newGroup[name] += ', ' + userResult[0].field_username;

 iris.invokeHook("hook_entity_edit", req.authPass, newGroup, req.params.entityType).then(function (success) {

 }, function (fail) {

 res.status(400).send(fail);

 });
 }
 else {
 // Update entity

 iris.invokeHook("hook_entity_edit", req.authPass, groupResult[0], groupResult[0]).then(function (success) {

 }, function (fail) {

 res.status(400).send(fail);

 });
 }

 }
 else {

 res.status(400).send("Not a valid member");

 }

 }, function (fail) {

 res.status(400).send(fail);

 })

 }

 }
 else {

 res.status(400).send("Not a valid group")

 }
 },
 function (fail) {

 res.status(400).send(fail);

 });

 })

 // Remove member from group

 // Add a member to a group

 iris.route.post("/groups/removeMember/:groupid/:member", function (req, res) {

 var fetch = {
 entities: ["group"],
 queries: [{
 field: "eid",
 "operator": "is",
 "value": req.params.groupid
 }]
 }

 iris.invokeHook("hook_entity_fetch", req.authPass, null, fetch).then(function (groupResult) {

 if (groupResult.length) {

 if (groupResult[0].members.indexOf(parseInt(req.params.member)) === -1) {

 res.status(400).send("Member not in group");

 }
 else {


 // All OK, try to add member to group

 var memberIndex = groupResult[0].members.indexOf(parseInt(req.params.member));

 groupResult[0].members.splice(memberIndex, 1);

 // Update entity

 iris.invokeHook("hook_entity_edit", req.authPass, groupResult[0], groupResult[0]).then(function (success) {

 res.send(success);

 }, function (fail) {

 res.status(400).send(fail);

 })

 }

 }
 else {

 res.status(400).send("Not a valid group")

 }
 },
 function (fail) {

 res.status(400).send(fail);

 });
 });
 */

/**
 * Callback to update the last_checked field on the group entity so that the correct unread count can be calculated.
 */
iris.route.get("/read-group/:gid/:uid", {}, function (req, res) {

  // Fetch the group entity.
  var fetch = {
    entities: ["group"],
    queries: [{
      field: "eid",
      "operator": "is",
      "value": req.params.gid
    }]
  };

  iris.invokeHook("hook_entity_fetch", req.authPass, null, fetch).then(function (group) {

    group = group[0];

    group.field_users.forEach(function (user, index) {

      if (user.field_uid == req.params.uid) {

        // Set the last_checked field to the current timestamp.
        group.field_users[index].field_last_checked = Math.floor(Date.now() / 1000);

        // Save the entity.
        iris.invokeHook("hook_entity_edit", 'root', group, group).then(function (success) {

        }, function (fail) {

          iris.log("error", fail);

        });
      }
    });

  });
  res.send('Registered');

});

/**
 * Implements hook_entity_presave.
 * Before a message is saved, update the last_updated field of the group to correctly order groups in lists.
 */
iris.modules.groups.registerHook("hook_entity_presave", 0, function (thisHook, entity) {

  if (entity.entityType == 'message') {

    entity.field_created = Math.floor(Date.now() / 1000);
    var fetch = {
      entities: ["group"],
      queries: [{
        field: "eid",
        "operator": "is",
        "value": (typeof entity.groups == 'array') ? entity.groups[0] : entity.groups
      }]
    };

    // Fetch the parent group.
    iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (groupResult) {

      if (groupResult.length > 0) {

        groupResult.forEach(function (group) {

          group.field_last_updated = Math.floor(Date.now() / 1000);

          iris.invokeHook("hook_entity_edit", thisHook.authPass, null, group).then(function (success) {

          }, function (fail) {

            iris.log("error", fail);

          });
        });
      }
    }, function (fail) {

      iris.log("error", fail);

    });

  }

  thisHook.pass(entity);

});

/**
 * Implements hook_entity_view_[entityType].
 * Get the unread messages since last checked in.
 */
iris.modules.groups.registerHook("hook_entity_view_group", 0, function (thisHook, entity) {

  var date;

  // Get the last_checked date to compare.
  if (entity.field_users) {
    entity.field_users.forEach(function (value) {
      if (value.field_uid == thisHook.authPass.userid) {
        date = value.field_last_checked;
      }
    });

    if (!date) {
      // If there is no last checked date, make it really old to fetch all messages.
      date = 0;
    }

    var fetch = {
      entities: ['message'],
      'queries': [{
        field: 'field_created',
        operator: 'gt',
        value: date
      },
        {
          field: 'groups',
          operator: 'INCLUDES',
          value: entity.eid
        }
      ]
    };

    iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (messages) {

      // If there are unread messages, add a temporary field to the group that is broadcast to clients but not saved
      // to the entity.
      if (messages) {

        entity.unread = messages.length;

      }

      thisHook.pass(entity);

    }, function (fail) {

      iris.log("error", fail);

      thisHook.fail(fail);

    });
  }
  else {

    thisHook.pass(entity);

  }

});

/**
 * Implements hook_entity_view_[entityType].
 * Adds a temporary field to the user entity that is broadcast to clients to determine if they are online or not.
 */
iris.modules.groups.registerHook("hook_entity_view_user", 0, function (thisHook, user) {

  if (user.field_external_id && iris.modules.auth.globals.userList[user.field_external_id]) {

    user.online = true;

  }
  else if (user.online) {

    delete user.online;

  }

  thisHook.pass(user);

});

/**
 * Implements hook_socket_authentication.
 * Broadcast a message to all clients when a user authenticates via socket.
 */
iris.modules.groups.registerHook("hook_socket_authenticated", 1, function (thisHook, data) {

  iris.sendSocketMessage(['*'], 'userConnect', thisHook.context.socket.authPass.userid);

  thisHook.pass(data);

});

/**
 * Implements hook_socket_disconnected.
 * Broadcast a message to all clients when a user disconnects via socket.
 */
iris.modules.groups.registerHook("hook_socket_disconnected", 1, function (thisHook, data) {

  iris.sendSocketMessage(['*'], 'userDisconnect', thisHook.context.userid);

  thisHook.pass(data);

});