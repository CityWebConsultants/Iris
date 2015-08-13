var exports;

var frisby = require('frisby');

var config = require('./test_config');

var utils = require('./test_header');

var apiUrl = config.apiUrl;

// Import dependent specs

var messages_spec = require('./messages_spec');

// CREATE GROUP - normal, 1 member (VALID)

var message_normal_base = {

  userid: "1",
  content: "Test message.",
  type: "text",
  //  hideFromPublicGroup: false;


}

exports.createMessage_val = function (data) {

  message_normal_base.credentials = data.userCredentials;

  var message = message_normal_base;

  message.groupid = data.groupid;

  frisby.create("Create message (standard)")
    .post(apiUrl + '/entity/create/message', utils.stringifyParameters(message))
    .expectStatus(200)
    .expectJSON({
      userid: function (val) {
        expect(val).toBe(message.userid);
      },
      type: function (val) {
        expect(val).toBe(message.type);
      },
      content: function (val) {
        expect(val).toBe(message.content);
      },
      groupid: function (val) {
        expect(val).toBe(message.groupid);
      }
    })
    .afterJSON(function (json) {

      data.messageid = json._id;

      exports.createMessageReply_val(data);

    })
    .toss();

};

exports.createMessageReply_val = function (data) {

  message_normal_base.credentials = data.userCredentials;

  var message = message_normal_base;

  message.groupid = data.groupid;

  message.replyTo = data.messageid;

  frisby.create("Create reply to message (standard)")
    .post(apiUrl + '/entity/create/message', utils.stringifyParameters(message))
    .expectStatus(200)
    .expectJSON({
      userid: function (val) {
        expect(val).toBe(message.userid);
      },
      type: function (val) {
        expect(val).toBe(message.type);
      },
      content: function (val) {
        expect(val).toBe(message.content);
      },
      groupid: function (val) {
        expect(val).toBe(message.groupid);
      },
      parents: function (val) {
        expect(val).toBe([message.replyTo]);
      }
    })
    .afterJSON(function (json) {

      data.replyMessageid = json._id;

    })
    .toss();

};

module.exports = exports;
