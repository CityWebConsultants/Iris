iris.registerModule("messages");

iris.modules.messages.registerHook("hook_entity_created_message", 0, function (thisHook, data) {

  // Loop over recipients and fire off recipient hooks

  if (data.messageRecipients) {

    Object.keys(data.messageRecipients[0]).forEach(function (recipientType) {

      iris.hook("hook_messages_recieved_" + recipientType, thisHook.authPass, {
          recipients: data.messageRecipients[0][recipientType],
          content: data.messageContent,
          type: data.messageType
        },
        null
      ).then(function (data) {



      }, function (fail) {

        if (fail !== "No such hook exists") {

          iris.log("error", fail);

        }

      });

    })

  }

  thisHook.finish(true, data);

})

iris.modules.messages.registerHook("hook_messages_recieved_user", 0, function (thisHook, data) {

  thisHook.finish(true, data);

})
