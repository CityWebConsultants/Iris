/*jslint node: true nomen: true*/

"use strict";

C.registerModule("group_manager", true);

//Additional includes

require('./group_validate');
require('./group_membership');

C.registerDbModel("group");

C.registerDbSchema("group", {

  name: {
    type: String,
    description: "Group name goes here",
    title: "Name",
    required: false
  },
  members: {
    "title": "members",
    "description": "Group members go here",
    type: [{
      _id: false,
      userid: {
        title: "UserID",
        type: String,
        required: true,
      },
      roles: {
        type: [String],
        title: "Roles",
        required: false
      },
      lastUpdated: {
        title: "Last updated",
        type: Date,
        required: false
      },
      joined: {
        title: "Joined",
        type: Date,
        required: false
      }
      }]
  },
  entityRef: {
    title: "Entity reference",
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  type: {
    title: "Group type",
    type: String,
    required: false,
    default: "default",
  },
  is121: {
    title: "Is one to one group?",
    type: Boolean,
    required: false,
  }
});

CM.group_manager.globals = {

  fetchGroupById: C.promise(function (_id, yes, no) {

    C.dbCollections.group.findOne({
      '_id': _id
    }, function (err, doc) {

      if (err) {

        no("Database error");

      }

      if (doc) {

        yes(doc);

      } else {

        no(false);

      }


    })
  }),
  checkGroupMembership: C.promise(function (data, yes, no) {
    C.dbCollections.group.findOne({
      '_id': data._id,
      'members': {
        '$elemMatch': {
          'userid': data.userid
        }
      }
    }, "members", function (err, doc) {

      if (err) {

        no("Database error");

      }

      if (doc) {

        //Return member and their roles

        doc.members.forEach(function (member) {

          if (member.userid = data.userid) {

            yes(member);

          };

        });

      } else {

        no(false);

      }


    })
  }),
  groupTypes: C.include(__dirname + "/group_types.js", C.configPath + "/group_manager/group_types.js"),

  checkGroupPermission: function (groupPermissionType, permissionsArray, GroupRolesArray) {

    var rolePermissions = [];

    GroupRolesArray.forEach(function (role) {

      if (CM.group_manager.globals.groupTypes[groupPermissionType] && CM.group_manager.globals.groupTypes[groupPermissionType].permissions[role]) {

        CM.group_manager.globals.groupTypes[groupPermissionType].permissions[role].forEach(function (permission) {

          rolePermissions.push(permission);

        });

      }

    });

    return permissionsArray.every(function (element) {

      return rolePermissions.indexOf(element) !== -1;

    });

  }

}
