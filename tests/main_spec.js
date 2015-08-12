var frisby = require('frisby');

var apiUrl = "http://localhost:3015";

//Administrator

var adminAuth = {
  "secretkey": "letmein",
  "apikey": "letmein",
};

var credentials = {};

// MAKE AUTH

var data = {
  userCredentials: { userid: 1 }
};

var makeAuth_valid = function () {

  frisby.create("Make auth token")
  .post(apiUrl + "/auth/maketoken", {
    credentials: JSON.stringify(adminAuth),
    userid: JSON.stringify("1")
  })
  .expectStatus(200)
  .expectJSONTypes({
    id: String,
    timestamp: Number
  })
  .afterJSON(function (json) {

    data.userCredentials.token = json.id;

    checkAuth_valid(data);

  })
  .toss();

};

makeAuth_valid();

// CHECK AUTH

var checkAuth_valid = function (data) {

  frisby.create("Check auth token is valid")
  .get(apiUrl + '/auth/checkauth?credentials=' + JSON.stringify(data.userCredentials))
  .expectStatus(200)
  .expectJSON({
    roles: function (val) {
      expect(val).toContain("authenticated");
    },
    userid: function (val) {
      expect(val).toBe(data.userCredentials.userid);
    }
  })
  .afterJSON(function (json) {
    createGroup_valid(data);
  })
  .toss();

};

// CREATE GROUP - normal, 1 member (VALID)

var group_normal_public_base = {

  "name": "test",
  "members": [{
    "userid": "1",
    "roles": ["group member"]
  }],
  "type": "public",

}

var createGroup_valid = function (data) {

  group_normal_public_base.credentials = data.userCredentials;

  frisby.create("Create group (standard)")
  .post(apiUrl + '/entity/create/group', group_normal_public_base)
  .expectStatus(200)
  .inspectBody()
  .expectJSON({
    name: function (val) {
      expect(val).toBe(group.name);
    },
    members: function (val) {

      // todo - assert that members are as they should be

    },
    type: function (val) {
      expect(val).toBe(group.type);
    }
  })
  .afterJSON(function (json) {

    data.groupid = json._id;

    updateGroup(data);

  })
  .toss();

};

// UPDATE GROUP (STATUS)

  var group = {

    "name": "test",
    "members": [{
      "userid": "1"
    }, {
      "userid": "1"
    }],
    "type": "soandso",
    "is121": true,

  };

var updateGroup = function (data) {

  group.credentials = data.userCredentials;
  group._id = data.groupid;

  frisby.create("Update group")
  .post(apiUrl + "/entity/edit/group", group)
  .inspectBody()
  .after(function () {

    create121Group_inv_notEnoughMembers(data);

  })
  .toss();

};

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

var create121Group_inv_notEnoughMembers = function (data) {

  group_121_base.credentials = data.userCredentials;

  frisby.create("Fail creation of 121 group with not enough members")
  .post(apiUrl + '/entity/create/group', group_121_base)
  .expectStatus(200)
  .inspectBody()
  .after(function () {

    data.group_121_base = group_121_base;

    create121Group_inv_tooManyMembers(data);

  })
  .toss();

};

var create121Group_inv_tooManyMembers = function (data) {

  var group = data.group_121_base;

  group.members.push({userid: 25});
  group.members.push({userid: 99});

  frisby.create("Fail creation of 121 group with too many members")
  .post(apiUrl + '/entity/create/group', group)
  .expectStatus(200)
  .inspectBody()
  .after(function (json) {

    create121Group_inv_hasEntityRef(data);

  })
  .toss();

};

var create121Group_inv_hasEntityRef = function (data) {

  var group = data.group_121_base;

  group.members.push({userid: 25});

  group.entityRef = "1";

  frisby.create("Fail creation of 121 group with an entityRef")
  .post(apiUrl + '/entity/create/group', group)
  .expectStatus(200)
  .inspectBody()
  .toss();

};
