CM.group_manager.registerHook("hook_entity_access_create_message", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["can create message"], thisHook.authPass)) {

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, "Cannot create messages");

  }

});
