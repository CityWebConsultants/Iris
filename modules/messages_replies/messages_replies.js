/*jslint node: true nomen: true*/

"use strict";

require('mongoose').Types;

C.registerModule("messages_replies");

/* ------- */

// Add parents to message schema
C.registerDbSchema("message", {
  parents: {
    type: [String],
    required: false
  },
  replyTo: {
    type: String
  }

});

/* ------- */


CM.messages_replies.registerHook("hook_entity_view_message", 1, function (thisHook, data) {

  //Add author

  // Prepare threaded message

  var prepareThreads = function (messages) {

    var rootMessages = [];

    var output = [];

    var sort = function (a, b) {

      if (a.parents.length < b.parents.length) {
        return 1;
      }
      if (a.parents.length > b.parents.length) {
        return -1;
      }
      // a must be equal to b
      return 0;
    };

    messages.forEach(function (element, index) {

      var current = element.parents;

      if (!current || current.length === 0) {
        rootMessages.push(element);
      }

    });

    rootMessages.forEach(function (rootMessage, index) {

      var thread = [];

      thread.push(rootMessage);

      messages.forEach(function (element, messageIndex) {

        var current = element.parents;

        if (current && current.indexOf(rootMessage._id.toString()) !== -1) {
          thread.push(element);
        }

      });

      thread.sort(sort);

      var getMessageById = function (id) {
        var returns;

        messages.forEach(function (element) {

          if (element._id.toString() === id) {
            returns = element;
          }

        });

        return returns;
      };

      thread.forEach(function (flatMessage, messageIndex) {

        // Ignore root
        if (flatMessage.parents && flatMessage.parents.length > 0) {

          var parentMessage = getMessageById(flatMessage.parents[flatMessage.parents.length - 1]);

          if (parentMessage) {

            if (!parentMessage.replies) {
              parentMessage.replies = [];
            }

            parentMessage.replies.push(flatMessage);

          } else {

            console.log("Broken reply chain.");

          }

        }

      });

      output.push(thread[thread.length - 1]);

    });

    return output;

  };

  thisHook.finish(true, prepareThreads(data));

});


CM.messages_replies.registerHook("hook_entity_validate_message", 1, function (thisHook, entity) {

  var pass = function (data) {

    thisHook.finish(true, data);

  }

  var fail = function (data) {

    thisHook.finish(false, data);

  }

  if (entity.replyTo) {

    var prepareReplies = C.promise(function (data, yes, no) {

      CM.messages.globals.fetchMessageById(entity.replyTo).then(function (fetchedMessage) {

        yes(data);

      }, function (fail) {

        no(C.error(400, "Cannot reply to a message that does not exist"));

      });

    });

    C.promiseChain([prepareReplies], entity, pass, fail);

  } else {
    pass(entity);
  }

});

CM.messages_replies.registerHook("hook_entity_presave_message", 1, function (thisHook, entity) {

  if (entity.replyTo) {

    CM.messages.globals.fetchMessageById(entity.replyTo).then(function (fetchedMessage) {

      if (fetchedMessage.parents.length > 0) {

        fetchedMessage.parents.push(fetchedMessage._id.toString());

        entity.parents = fetchedMessage.parents;

      } else {

        entity.parents = [fetchedMessage._id.toString()];

      }

      thisHook.finish(true, entity);

    }, function (fail) {

      thisHook.finish(false, C.error(400, "Cannot reply to a message that does not exist"));

    });

  } else {

    thisHook.finish(true, entity);

  }

});

// Tell user to update message thread
CM.messages_replies.registerHook("hook_entity_created_message", 1, function (thisHook, data) {

  C.sendSocketMessage(["*"], "updateMessageThread", null);

  thisHook.finish(true, data);

});
