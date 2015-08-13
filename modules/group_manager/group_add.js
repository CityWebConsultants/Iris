CM.group_manager.registerHook("hook_entity_access_create_group", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["can create group"], thisHook.authPass)) {

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, "Cannot create groups");

  }

});
