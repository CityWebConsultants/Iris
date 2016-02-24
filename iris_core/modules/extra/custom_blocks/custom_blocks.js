iris.modules.blocks.globals.registerBlockType("Custom-HTML");

iris.modules.custom_blocks.registerHook("hook_form_render_blockForm_Custom-HTML", 0, function (thisHook, data) {

  var currentContents = '';

  if (thisHook.const.params[1] && iris.modules.blocks.globals.blocks["Custom-HTML"] && iris.modules.blocks.globals.blocks["Custom-HTML"][thisHook.const.params[1]]) {

    currentContents = iris.modules.blocks.globals.blocks["Custom-HTML"][thisHook.const.params[1]].contents;

  }

  // Add in fields

  data.schema.contents = {
    "type": "textarea",
    "title": "Body",
    "description": "Custom HTML body for this block.",
    "default": currentContents,
  };
  
  thisHook.finish(true, data);

});

// Render those blocks!

iris.modules.custom_blocks.registerHook("hook_block_render", 0, function (thisHook, data) {
  
  if (thisHook.const.type === "Custom-HTML") {

    thisHook.finish(true, thisHook.const.config.contents);

  }

  thisHook.finish(true, data);

});
