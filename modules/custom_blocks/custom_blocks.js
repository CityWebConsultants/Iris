C.registerModule("custom_blocks");

CM.blocks.globals.registerBlockType("Template-file");
CM.blocks.globals.registerBlockType("Custom-HTML");

CM.custom_blocks.registerHook("hook_form_render_blockForm_Template-file", 0, function (thisHook, data) {

  var currentTemplate = '';

  if (thisHook.const.params[1] && CM.blocks.globals.blocks["Template-file"] && CM.blocks.globals.blocks["Template-file"][thisHook.const.params[1]]) {

    currentTemplate = CM.blocks.globals.blocks["Template-file"][thisHook.const.params[1]].template;

  }

  // Add in fields

  var form = {
    "template": {
      "type": "string",
      "title": "Template filename",
      "description": "Will be checked for in modules and theme.",
      "default": currentTemplate
    },
  };

  Object.keys(form).forEach(function (formField) {

    data.schema[formField] = form[formField];

  })

  thisHook.finish(true, data);

});

CM.custom_blocks.registerHook("hook_form_render_blockForm_Custom-HTML", 0, function (thisHook, data) {

  var currentContents = '';

  if (thisHook.const.params[1] && CM.blocks.globals.blocks["Custom-HTML"] && CM.blocks.globals.blocks["Custom-HTML"][thisHook.const.params[1]]) {

    currentContents = CM.blocks.globals.blocks["Custom-HTML"][thisHook.const.params[1]].contents;

  }

  // Add in fields

  var form = {
    "contents": {
      "type": "ckeditor",
      "title": "Body",
      "description": "Custom HTML body for this block.",
      "default": currentContents,
    },
  };

  Object.keys(form).forEach(function (formField) {

    data.schema[formField] = form[formField];

  })

  thisHook.finish(true, data);

});

// Render those blocks!

CM.custom_blocks.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.const.type === "Template-file") {

    thisHook.finish(true, "Test")

    return true;

  } else if (thisHook.const.type === "Custom-HTML") {
    
    thisHook.finish(true, thisHook.const.config.contents);
    return true;

  }

  thisHook.finish(true, data);

});
