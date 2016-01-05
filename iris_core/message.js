var messageStore = {};

iris.messageStore = {};

iris.message = function (userid, message, type, parameters) {

  if (!iris.messageStore[userid]) {

    iris.messageStore[userid] = [];

  }

  iris.messageStore[userid].push({

    message: message,
    type: type,
    parameters: parameters

  })

}

iris.readMessages = function (userid) {

  var messages = [];

  // Return messages and wipe them as being read

  if (iris.messageStore[userid]) {

    iris.messageStore[userid].forEach(function (message, index) {

      messages.push(message);

      // Delete message from global store

      iris.messageStore[userid].splice(index, 1);

    })

  }

  // Remove duplicate messages

  messages.forEach(function (message, index) {

    messages.forEach(function (searchmessage) {

      if(message.message === searchmessage.message){
        
        messages.splice(index, 1);
        
      }

    })

  })

  return messages;

}
