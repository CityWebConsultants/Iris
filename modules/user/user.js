C.registerModule("user");

C.registerDbModel("user");

C.registerDbSchema("user", {

  name: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true
  }

});
