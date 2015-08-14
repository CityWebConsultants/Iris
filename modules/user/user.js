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

CM.group_manager.registerHook("hook_entity_access_create_user", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["can create users"], thisHook.authPass)) {

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, "Cannot create users");

  }

});

