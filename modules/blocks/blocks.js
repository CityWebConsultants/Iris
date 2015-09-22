C.registerModule("blocks");

CM.blocks.registerHook("hook_block_registerType", 0, function (thisHook, data) {

  if (!thisHook.const.name) {

    thisHook.finish(false, "must have a name");

  } else if (!thisHook.const.form) {

    thisHook.finish(false, "must have a form");

  } else {

    thisHook.finish(true, data);

  }

});

CM.blocks.registerHook("hook_block_loadConfig", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else {

    thisHook.finish(true, data);

  }

});

CM.blocks.registerHook("hook_block_saveConfig", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else if (!thisHook.const.config) {

    thisHook.finish(false, "must have a config");

  } else {

    thisHook.finish(true, data);

  }

});

CM.blocks.registerHook("hook_block_view", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else if (!thisHook.const.config) {

    thisHook.finish(false, "must have a config");

  } else {

    thisHook.finish(true, data);

  }

});
