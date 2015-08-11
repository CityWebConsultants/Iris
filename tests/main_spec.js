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

var makeAuth = function () {

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

    checkAuth(data);

  })
  .toss();

};

makeAuth();

// CHECK AUTH

var checkAuth = function (data) {

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
    createGroup(data);
  })
  .toss();

};

// CREATE GROUP - normal, 1 member (VALID)

var group = {

  "name": "test",
  "members": [{
    "userid": "1",
    "roles": ["group member"]
  }],
  "type": "public",

}

var createGroup = function (data) {

  group.credentials = data.userCredentials;

  frisby.create("Create group (standard)")
  .post(apiUrl + '/entity/create/group', group)
  .expectStatus(200)
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

  }

var updateGroup = function (data) {

  group.credentials = data.userCredentials;
  group._id = data.groupid;

  frisby.create("Update group")
  .post(apiUrl + "/entity/edit/group", group)
  .inspectBody()
  .toss();

}
