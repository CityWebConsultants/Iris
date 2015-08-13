var frisby = require('frisby');

var config = require('./test_config');

var utils = require('./test_header');

var apiUrl = config.apiUrl;

// Import dependent specs

var group_manager_spec = require('./group_manager_spec');

var messages_spec = require('./messages_spec');

//Administrator

var adminAuth = {
  "secretkey": "letmein",
  "apikey": "letmein",
};

var credentials = {};

// MAKE AUTH

var data = {
  userCredentials: {
    userid: 1
  }
};

var makeAuth_valid = function () {

  frisby.create("Make auth token")
    .post(apiUrl + "/auth/maketoken", utils.stringifyParameters({
      credentials: adminAuth,
      userid: "1"
    }))
    .inspectBody()
    .expectStatus(200)
    .expectJSONTypes({

      response: {
        id: String,
        timestamp: Number
      }
    })
    .afterJSON(function (json) {

      data.userCredentials.token = json.response.id;

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
      group_manager_spec.createGroup_valid(data);
    })
    .toss();

};
