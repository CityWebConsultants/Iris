var exports;

var frisby = require('frisby');

var config = require('./test_config');

var utils = require('./test_header');

var apiUrl = config.apiUrl;

// Import dependent specs

var messages_spec = require('./messages_spec');

// CREATE GROUP - normal, 1 member (VALID)

var group_normal_public_base = {

  "name": "test",
  "members": [{
    "userid": "1",
    "roles": ["group member"]
  }],
  "type": "public",

}

exports.createGroup_valid = function (data) {

  group_normal_public_base.credentials = data.userCredentials;

  frisby.create("Create group (standard)")
    .post(apiUrl + '/entity/create/group', utils.stringifyParameters(group_normal_public_base))
    .expectStatus(200)
    .expectJSON({
      name: function (val) {
        expect(val).toBe(group_normal_public_base.name);
      },
      members: function (val) {

        // todo - assert that members are as they should be

      },
      type: function (val) {
        expect(val).toBe(group_normal_public_base.type);
      }
    })
    .afterJSON(function (json) {

      data.groupid = json._id;

      exports.updateGroup(data);

    })
    .toss();

};

// UPDATE GROUP (STATUS)

var group = {

  "name": "test2",


};

exports.updateGroup = function (data) {

  group.credentials = data.userCredentials;
  group._id = data.groupid;

  frisby.create("Update group")
    .post(apiUrl + "/entity/edit/group", utils.stringifyParameters(group))
    .inspectBody()
    .expectStatus(200)
    .afterJSON(function (json) {

      exports.updateGroupAddMember(data);

    })
    .toss();

};

exports.updateGroupAddMember = function (data) {

  frisby.create("Update group - add member")
    .post(apiUrl + '/group/addmember', utils.stringifyParameters({
      credentials: data.userCredentials,
      member: {userid: "2", roles: ["group_member"]},
      _id: data.groupid
    }))
    .inspectBody()
    .expectStatus(200)
    .afterJSON(function (json) {

      exports.create121Group_inv_notEnoughMembers(data);

    })
    .toss();

};

//exports.updateGroupAddMember = function (data) {
//
//};

// 121 GROUPS

// CREATE

var group_121_base = {
  name: 'default',
  members: [{
    userid: 1
  }],
  type: 'private',
  is121: true
};

exports.create121Group_inv_notEnoughMembers = function (data) {

  group_121_base.credentials = data.userCredentials;

  frisby.create("Fail creation of 121 group with not enough members")
    .post(apiUrl + '/entity/create/group', utils.stringifyParameters(group_121_base))
    .expectStatus(200)
    .after(function () {

      data.group_121_base = group_121_base;

      exports.create121Group_inv_tooManyMembers(data);

    })
    .toss();

};

exports.create121Group_inv_tooManyMembers = function (data) {

  var group = data.group_121_base;

  group.members.push({
    userid: 25
  });
  group.members.push({
    userid: 99
  });

  frisby.create("Fail creation of 121 group with too many members")
    .post(apiUrl + '/entity/create/group', utils.stringifyParameters(group))
    .expectStatus(200)
    .after(function (json) {

      exports.create121Group_inv_hasEntityRef(data);

    })
    .toss();

};

exports.create121Group_inv_hasEntityRef = function (data) {

  var group = data.group_121_base;

  group.members.push({
    userid: 25
  });

  group.entityRef = "1";

  frisby.create("Fail creation of 121 group with an entityRef")
    .post(apiUrl + '/entity/create/group', utils.stringifyParameters(group))
    .expectStatus(200)
    .after(function () {
      messages_spec.createMessage_val(data);
    })
    .toss();

};

module.exports = exports;
