iris.registerModule("menu_block");

iris.modules.blocks.globals.registerBlockType("menu");

iris.modules.menu_block.registerHook("hook_form_render_blockForm_menu", 0, function (thisHook, data) {

  var availableMenus = {};

  if (iris.configStore.menu) {

    availableMenus = Object.keys(iris.configStore.menu);

  }

  data.schema.menu = {
    type: "text",
    "title": "Menu",
    enum: availableMenus
  }

  thisHook.finish(true, data);

})


iris.modules.menu_block.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.const.type === "menu") {

    var config = thisHook.const.config;

    thisHook.finish(true, "[[[menu " + config.menu + "]]]");

  } else {

    thisHook.finish(true, data);

  }

});
