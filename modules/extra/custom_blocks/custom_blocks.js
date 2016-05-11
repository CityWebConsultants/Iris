iris.modules.blocks.globals.registerBlockType("Custom-HTML");

iris.modules.custom_blocks.registerHook("hook_form_render__blockForm_Custom-HTML", 0, function (thisHook, data) {

  var currentContents = '';

  if (thisHook.context.params && iris.modules.blocks.globals.blocks["Custom-HTML"] && iris.modules.blocks.globals.blocks["Custom-HTML"][thisHook.context.params]) {

    currentContents = iris.modules.blocks.globals.blocks["Custom-HTML"][thisHook.context.params].contents;

  }

  // Add in fields

  data.schema.contents = {
    "type": "textarea",
    "title": thisHook.authPass.t("Body"),
    "description": thisHook.authPass.t("Custom HTML body for this block."),
    "default": currentContents,
  };
  
  thisHook.pass(data);

});

// Render those blocks!

iris.modules.custom_blocks.registerHook("hook_block_render", 0, function (thisHook, data) {
  
  if (thisHook.context.type === "Custom-HTML") {

    thisHook.pass(thisHook.context.config.contents);

  }

  thisHook.pass(data);

});
