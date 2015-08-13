CM.group_manager.registerHook("hook_entity_access_edit_group", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["can edit group"], thisHook.authPass)) {

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, C.error(403, "Cannot edit groups"));

  }

});
