/*jslint node: true nomen: true*/

"use strict";

iris.registerModule("group_manager", true);

//Additional includes

require('./group_validate');
require('./group_membership');

iris.registerDbModel("group");

iris.registerDbSchema("group", {

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

iris.modules.group_manager.globals = {

  fetchGroupById: iris.promise(function (_id, yes, no) {

    iris.dbCollections.group.findOne({
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
  checkGroupMembership: iris.promise(function (data, yes, no) {
    iris.dbCollections.group.findOne({
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
  groupTypes: iris.include(__dirname + "/group_types.js", iris.configPath + "/group_manager/group_types.js"),

  checkGroupPermission: function (groupPermissionType, permissionsArray, GroupRolesArray) {

    var rolePermissions = [];

    GroupRolesArray.forEach(function (role) {

      if (iris.modules.group_manager.globals.groupTypes[groupPermissionType] && iris.modules.group_manager.globals.groupTypes[groupPermissionType].permissions[role]) {

        iris.modules.group_manager.globals.groupTypes[groupPermissionType].permissions[role].forEach(function (permission) {

          rolePermissions.push(permission);

        });

      }

    });

    return permissionsArray.every(function (element) {

      return rolePermissions.indexOf(element) !== -1;

    });

  }

}
