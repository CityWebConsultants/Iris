C.registerModule("chat_message");

C.registerDbModel("chatMessage");

C.registerDbSchema("chatMessage", {

  content: {
    type: String,
    required: true
  },


});
