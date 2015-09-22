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

CM.blocks.registerHook("hook_block_save", 0, function (thisHook, data) {

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

CM.blocks.registerHook("hook_block_load", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else {

    C.hook("hook_block_loadConfig", thisHook.authPass, thisHook.const, data).then(function (config) {

      var block = {

        id: thisHook.const.id,
        type: thisHook.const.type,
        config: config

      }

      C.hook("hook_block_render", thisHook.authPass, block, null).then(function (html) {

        thisHook.finish(true, html);

      }, function (fail) {

        thisHook.finish(false, fail);

      });

    }, function (fail) {

      thisHook.finish(false, fail);

    });

  }

});

CM.blocks.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else if (!thisHook.const.config) {

    thisHook.finish(false, "must have a configuration");

  } else {

    thisHook.finsh(true, data);

  }

});
