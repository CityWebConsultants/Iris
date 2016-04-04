/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

iris.messageStore = {};

iris.message = function (userid, message, type) {

  if (!iris.messageStore[userid]) {

    iris.messageStore[userid] = [];

  }

  iris.messageStore[userid].push({

    message: message,
    type: type

  });

  // Send messages to server for persistence

  process.send({
    messages: iris.messageStore
  });

};

iris.readMessages = function (userid) {

  var messages = [];

  // Return messages and wipe them as being read

  if (iris.messageStore[userid]) {

    iris.messageStore[userid].forEach(function (message, index) {

      messages.push(message);

    });

  }

  return messages;

};

iris.clearMessages = function (userid) {

  iris.messageStore[userid] = [];

};
