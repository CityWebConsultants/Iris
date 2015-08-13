/*jslint node: true nomen: true*/

"use strict";

C.registerModule("messages");

//Additional includes

require('./message_validate');
require('./message_add');

C.registerDbModel("message");

C.registerDbSchema("message", {
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

CM.messages.globals = {

  fetchMessageById: C.promise(function (_id, yes, no) {

    C.dbCollections.message.findOne({
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
