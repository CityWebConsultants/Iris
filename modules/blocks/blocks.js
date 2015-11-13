C.registerModule("blocks");

CM.blocks.globals.blockTypes = {};

// Object in which to store all blocks

CM.blocks.globals.blocks = {};

var fs = require('fs');
var glob = require("glob");

// Form for making new blocks

CM.forms.registerHook("hook_form_render_newBlockForm", 0, function (thisHook, data) {

  data.schema = {
    "blockType": {
      type: 'string',
      title: 'Block type',
      required: true,
      enum: Object.keys(CM.blocks.globals.blockTypes)
    }
  };

  thisHook.finish(true, data);

});

CM.forms.registerHook("hook_form_submit_newBlockForm", 0, function (thisHook, data) {

  data = function (res) {

    res.send("/admin/blocks/create/" + thisHook.const.params.blockType)

  }

  thisHook.finish(true, data);

});

C.app.get("/admin/blocks/create/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_blockform"], ['admin_wrapper'], {
    blocktype: req.params.type,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});

// Function for registering system blocks

CM.blocks.globals.registerBlock = function (config) {

  if (!CM.blocks.globals.blocks[config.type]) {

    CM.blocks.globals.blocks[config.type] = {};

  }

  CM.blocks.globals.blocks[config.type][config.id] = config;

}

// Read all blocks saved by the user

glob(C.configPath + "/blocks/*/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    try {

      config = JSON.parse(config);

      if (config.id && config.type) {

        // Make object for block type if it doesn't already exist

        if (!CM.blocks.globals.blocks[config.type]) {

          CM.blocks.globals.blocks[config.type] = {};

        }

        CM.blocks.globals.blocks[config.type][config.id] = config;

      }

    } catch (e) {

      C.log("error", e)

    }

  })

})

CM.blocks.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("block", data.html, function (block, next) {

    var blockName = block[1],
      blockType = block[0];

    if (!blockName || !blockType) {

      next("<!--- Could not load block " + block + " --->");
      return false;

    } else {

      // Correct paramaters, now let's see if we can load a block from config

      if (CM.blocks.globals.blocks[blockType] && CM.blocks.globals.blocks[blockType][blockName]) {

        var paramaters = {

          id: blockName,
          type: blockType,
          config: CM.blocks.globals.blocks[blockType][blockName]

        }

        C.hook("hook_block_render", thisHook.authPass, paramaters, null).then(function (html) {

          if (!html) {

            next("<!--- Could not load block " + block + " --->");

          } else {

            // Block loaded!

            next(html);

          }

        }, function (fail) {

          next("<!--- Could not load block " + block + " --->");

        })

      } else {

        next("<!--- Could not load block " + block + " --->");

      }

    }

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data)

  }, function (fail) {

    thisHook.finish(true, data)

  });

});

CM.blocks.globals.registerBlockType = function (name) {

  if (!name) {

    C.log("error", "block types must have a name")

  } else {

    // Add to global object of blockTypes

    CM.blocks.globals.blockTypes[name] = {};

  }

};

CM.blocks.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (!thisHook.const.id) {

    thisHook.finish(false, "must have an id");

  } else if (!thisHook.const.type) {

    thisHook.finish(false, "must have a type");

  } else if (!thisHook.const.config) {

    thisHook.finish(false, "must have a configuration");

  } else {

    thisHook.finish(true, data);

  }

});

// Add title field to block forms

CM.blocks.registerHook("hook_form_render", 0, function (thisHook, data) {

  var formTitle = thisHook.const.formId;

  if (formTitle.split("_")[0] === "blockForm") {

    if (!data.schema) {

      data.schema = {};

    }

    data.schema["blockTitle"] = {
      type: "string",
      required: true,
      title: "Block title"
    };

    data.schema["blockType"] = {
      type: "hidden",
      default: formTitle.split("_")[1]
    };

    // Check if a config file has already been saved for this block. If so, load in the current settings.

    C.readConfig("blocks/" + formTitle.split("_")[1], formTitle.split("_")[2]).then(function (output) {

      data.value = output;

      thisHook.finish(true, data);

    }, function (fail) {

      thisHook.finish(true, data);

    });

  } else {

    thisHook.finish(true, data);

  };

})

// Default form submit for block forms

CM.blocks.registerHook("hook_form_submit", 0, function (thisHook, data) {

  var formId = thisHook.const.params.formid;

  if (formId.split("_")[0] === "blockForm") {
    
    console.log(thisHook.const.params);

    C.saveConfig(thisHook.const.params, "blocks" + "/" + thisHook.const.params.blockType, thisHook.const.params.blockTitle, function () {
      
      var data = function (res) {

        res.send("/admin/blocks")

      }
      
      thisHook.finish(true, data);

    });

  } else {

    thisHook.finish(true, data);

  }

});
