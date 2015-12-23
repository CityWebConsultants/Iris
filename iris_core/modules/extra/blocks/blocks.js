iris.registerModule("blocks");

iris.modules.blocks.globals.blockTypes = {};

// Object in which to store all blocks

iris.modules.blocks.globals.blocks = {};

var fs = require('fs');
var glob = require("glob");

// Form for making new blocks

iris.modules.forms.registerHook("hook_form_render_newBlockForm", 0, function (thisHook, data) {

  data.schema = {
    "blockType": {
      type: 'string',
      title: 'Block type',
      required: true,
      enum: Object.keys(iris.modules.blocks.globals.blockTypes)
    }
  };

  thisHook.finish(true, data);

});

iris.modules.forms.registerHook("hook_form_submit_newBlockForm", 0, function (thisHook, data) {

  data = function (res) {

    res.send("/admin/blocks/create/" + thisHook.const.params.blockType)

  }

  thisHook.finish(true, data);

});

iris.app.get("/admin/blocks/create/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_blockform"], ['admin_wrapper'], {
    blocktype: req.params.type,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.app.get("/admin/blocks/edit/:type/:id", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_blockform"], ['admin_wrapper'], {
    blocktype: req.params.type,
    blockid: req.params.id
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.app.get("/admin/blocks/delete/:type/:id", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_blockdelete"], ['admin_wrapper'], {
    blocktype: req.params.type,
    blockid: req.params.id
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

// Function for registering system blocks

iris.modules.blocks.globals.registerBlock = function (config) {

  if (!iris.modules.blocks.globals.blocks[config.type]) {

    iris.modules.blocks.globals.blocks[config.type] = {};

  }

  iris.modules.blocks.globals.blocks[config.type][config.id] = config;

}

// Read all blocks saved by the user

glob(iris.configPath + "/blocks/*/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    try {

      config = JSON.parse(config);

      if (config.blockTitle && config.blockType) {

        // Make object for block type if it doesn't already exist

        if (!iris.modules.blocks.globals.blocks[config.blockType]) {

          iris.modules.blocks.globals.blocks[config.blockType] = {};

        }

        iris.modules.blocks.globals.blocks[config.blockType][config.blockTitle] = config;

        iris.saveConfig(config, "blocks" + "/" + config.blockType, config.blockTitle, function () {

        })

      }

    } catch (e) {

      iris.log("error", e)

    }

  })

})

iris.modules.blocks.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  iris.modules.frontend.globals.parseBlock("block", data.html, function (block, next) {

    var blockType = block[0],
      blockName = block[1];

    if (!blockName || !blockType) {

      next("<!--- Could not load block " + block + " --->");
      return false;

    } else {

      // Correct parameters, now let's see if we can load a block from config

      if (iris.modules.blocks.globals.blocks[blockType] && iris.modules.blocks.globals.blocks[blockType][blockName]) {

        var parameters = {

          id: blockName,
          type: blockType,
          config: iris.modules.blocks.globals.blocks[blockType][blockName]

        }

        iris.hook("hook_block_render", thisHook.authPass, parameters, null).then(function (html) {

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

iris.modules.blocks.globals.registerBlockType = function (name) {

  if (!name) {

    iris.log("error", "block types must have a name")

  } else {

    // Add to global object of blockTypes

    iris.modules.blocks.globals.blockTypes[name] = {};

  }

};

// Function for registering custom code blocks that don't have any config

iris.modules.blocks.globals.customBlocks = {};

iris.modules.blocks.globals.registerCustomBlock = function (name) {

  iris.modules.blocks.globals.customBlocks[name] = {};

};

iris.modules.blocks.registerHook("hook_block_render", 0, function (thisHook, data) {

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

iris.modules.blocks.registerHook("hook_form_render", 0, function (thisHook, data) {

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

    iris.readConfig("blocks/" + formTitle.split("_")[1], thisHook.const.params[1]).then(function (output) {

      data.value = output;

      // Hide the title as you shouldn't be able to change it

      data.schema["blockTitle"].type = "hidden";

      thisHook.finish(true, data);

    }, function (fail) {

      thisHook.finish(true, data);

    });

  } else {

    thisHook.finish(true, data);

  };

});

iris.modules.blocks.registerHook("hook_form_render_blockDeleteForm", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["blockTitle"] = {
    type: "hidden",
    default: thisHook.const.params[2]
  };

  data.schema["blockType"] = {
    type: "hidden",
    default: thisHook.const.params[1]
  };

  thisHook.finish(true, data);

});

iris.modules.blocks.registerHook("hook_form_submit_blockDeleteForm", 0, function (thisHook, data) {

  if (thisHook.const.params.blockTitle === 'starting-up') {

    thisHook.finish(false, data);

  }

  if (iris.modules.blocks.globals.blocks[thisHook.const.params.blockType] && iris.modules.blocks.globals.blocks[thisHook.const.params.blockType][thisHook.const.params.blockTitle]) {

    delete iris.modules.blocks.globals.blocks[thisHook.const.params.blockType][thisHook.const.params.blockTitle];

  }

  iris.deleteConfig("blocks/" + thisHook.const.params.blockType, iris.sanitizeFileName(thisHook.const.params.blockTitle), function (err) {

    if (err) {

      thisHook.finish(false, data);

    }

    var data = function (res) {

      res.send("/admin/blocks");

    };

    thisHook.finish(true, data);

  });

});

// Default form submit for block forms

iris.modules.blocks.registerHook("hook_form_submit", 0, function (thisHook, data) {

  var formId = thisHook.const.formid;

  if (formId.split("_")[0] === "blockForm") {

    thisHook.const.params.blockTitle = iris.sanitizeFileName(thisHook.const.params.blockTitle);

    if (!iris.modules.blocks.globals.blocks[thisHook.const.params.blockType]) {

      iris.modules.blocks.globals.blocks[thisHook.const.params.blockType] = {};

    }

    iris.modules.blocks.globals.blocks[thisHook.const.params.blockType][thisHook.const.params.blockTitle] = thisHook.const.params;

    iris.saveConfig(thisHook.const.params, "blocks" + "/" + thisHook.const.params.blockType, iris.sanitizeFileName(thisHook.const.params.blockTitle), function () {

      var data = function (res) {

        res.send("/admin/blocks")

      }

      thisHook.finish(true, data);

    });

  } else {

    thisHook.finish(true, data);

  }

});
