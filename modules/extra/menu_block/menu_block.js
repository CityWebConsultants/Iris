iris.modules.blocks.globals.registerBlockType("menu");

iris.modules.menu_block.registerHook("hook_form_render__blockForm_menu", 0, function (thisHook, data) {

  iris.modules.menu_ui.globals.getMenuList().then(function (menuList) {

    data.schema.menu = {
      type: "text",
      "title": thisHook.authPass.t("Menu"),
      enum: menuList
    }

    thisHook.pass(data);


  })

});


iris.modules.menu_block.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.context.type === "menu") {

    var config = thisHook.context.config;

    thisHook.pass("[[[menu " + config.menu + "]]]");

  } else {

    thisHook.pass(data);

  }

});
