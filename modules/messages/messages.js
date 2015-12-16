/*jslint node: true nomen: true*/

"use strict";

iris.registerModule("messages");

//Additional includes

require('./message_validate');

iris.registerDbModel("message");

iris.registerDbSchema("message", {
  userid: {
    type: String,
    required: true
  },
  groupid: {
    type: String,
    required: true
  },
  ccGroupid: {
    type: Array,
    required: false
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  hideFromPublicGroup: {
    type: Boolean,
    required: false
  }

});

iris.modules.messages.globals = {

  fetchMessageById: iris.promise(function (_id, yes, no) {

    iris.dbCollections.message.findOne({
      '_id': _id
    }, function (err, doc) {

      if (err) {

        no("Database error");

      }

      if (doc) {

        yes(doc);

      } else {

        no(false);

      }


    })
  })

}

