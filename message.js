


iris.messageStore = {};

iris.message = function (userid, message, type) {

  if (!iris.messageStore[userid]) {

    iris.messageStore[userid] = [];

  }

  iris.messageStore[userid].push({

    message: message,
    type: type

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
