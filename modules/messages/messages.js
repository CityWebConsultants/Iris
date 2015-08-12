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
  },
  parents: {
    type: Array,
    required: false
  },

});