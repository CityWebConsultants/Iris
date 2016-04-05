/**
 * @file Methods and hooks used to implement the Blocks layout system
 */

/**
 * @namespace blocks
 */

/**
 * @member blockTypes
 * @memberof blocks
 *
 * @desc Block types store. Keeps a record of all available block types; this is also stored in config files.
 */
iris.modules.blocks.globals.blockTypes = {};

/**
 * @member blocks
 * @memberof blocks
 *
 * @desc Blocks store. Keeps a record of all block instances; this is also stored in config files.
 */
iris.modules.blocks.globals.blocks = {};

var fs = require('fs');
var glob = require("glob");

/**
 * Define callback routes.
 */
var routes = {
  createBlock : {
    title: "Create block",
    permissions: ["can access admin pages"],
  },
  editBlock : {
    title: "Edit block",
    permissions: ["can access admin pages"],
  },
  deleteBlock : {
    title: "Delete block",
    permissions: ["can access admin pages"],
  }
}

/**
 * Admin page callback: create block of type :type.
 */
iris.route.get("/admin/blocks/create/:type", routes.createBlock, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_blockform"], ['admin_wrapper'], {
    blocktype: req.params.type,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

/**
 * Admin page callback: edit block.
 */
iris.route.get("/admin/blocks/edit/:type/:id", routes.editBlock, function (req, res) {

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

/**
 * Admin page callback: delete block.
 */
iris.route.get("/admin/blocks/delete/:type/:id", routes.deleteBlock, function (req, res) {

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

/**
 * Defines form newBlockForm.
 * Form for making new blocks.
 */
iris.modules.forms.registerHook("hook_form_render__newBlockForm", 0, function (thisHook, data) {

  data.schema = {
    "blockType": {
      type: 'string',
      title: 'Block type',
      required: true,
      enum: Object.keys(iris.modules.blocks.globals.blockTypes)
    }
  };

  thisHook.pass(data);

});

/**
 * Form submit handler for newBlockForm.
 */
iris.modules.forms.registerHook("hook_form_submit__newBlockForm", 0, function (thisHook, data) {

  data = function (res) {

    res.json({
      redirect: "/admin/blocks/create/" + thisHook.context.params.blockType
    })

  }

  thisHook.pass(data);

});

/**
 * @function registerBlock
 * @memberof blocks
 *
 * @desc Register a block in code
 *
 * @param {object} config - The block configuration object to save
 */
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

iris.modules.blocks.registerHook("hook_frontend_embed__block", 0, function (thisHook, data) {
  
  var blockType = thisHook.context.embedID,
    blockName = thisHook.context.embedOptions; // TODO - Allow JSON object for more tag options

  if (!blockName || !blockType) {

    thisHook.pass("");
    return false;

  } else {

    // Correct parameters, now let's see if we can load a block from config

    if (iris.modules.blocks.globals.blocks[blockType] && iris.modules.blocks.globals.blocks[blockType][blockName]) {

      var parameters = {

        id: blockName,
        type: blockType,
        config: iris.modules.blocks.globals.blocks[blockType][blockName]

      }

      iris.invokeHook("hook_block_render", thisHook.authPass, parameters, null).then(function (html) {

        if (!html) {

          thisHook.pass("");

        } else {

          // Block loaded!

          thisHook.pass(html);

        }

      }, function (fail) {

        thisHook.pass("");

      })

    } else {

      thisHook.pass("");

    }

  }

});

/**
 * @function registerBlockType
 * @memberof blocks
 *
 * @desc Register a new block type
 *
 * @param {string} name - The name of the block type
 */
iris.modules.blocks.globals.registerBlockType = function (name) {

  if (!name) {

    iris.log("error", "block types must have a name")

  } else {

    // Add to global object of blockTypes

    iris.modules.blocks.globals.blockTypes[name] = {};

  }

};

/**
 * @member hook_block_render
 * @memberof blocks
 *
 * @desc Block render hook
 *
 * Expects to have thisHook.context contain an id, type and config pertaining to the block that is being rendered.
 *
 * May be hooked into to change the display of blocks.
 */
iris.modules.blocks.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (!thisHook.context.id) {

    thisHook.fail("must have an id");

  } else if (!thisHook.context.type) {

    thisHook.fail("must have a type");

  } else if (!thisHook.context.config) {

    thisHook.fail("must have a configuration");

  } else {

    thisHook.pass(data);

  }

});

// Add title field to block forms

iris.modules.blocks.registerHook("hook_form_render", 0, function (thisHook, data) {

  var formTitle = thisHook.context.formId;

  if (formTitle.split("_")[0] === "blockForm") {

    if (!data.schema) {

      data.schema = {};

    }

    data.schema.blockTitle = {
      type: "string",
      required: true,
      title: thisHook.authPass.t("Block title")
    };

    data.schema.blockType = {
      type: "hidden",
      default: formTitle.split("_")[1]
    };

    // Check if a config file has already been saved for this block. If so, load in the current settings.

    iris.readConfig("blocks/" + formTitle.split("_")[1], thisHook.context.params[1]).then(function (output) {

      data.value = output;

      // Hide the title as you shouldn't be able to change it

      data.schema.blockTitle.type = "hidden";

      thisHook.pass(data);

    }, function (fail) {

      thisHook.pass(data);

    });

  } else {

    thisHook.pass(data);

  };

});

iris.modules.blocks.registerHook("hook_form_render__blockDeleteForm", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["blockTitle"] = {
    type: "hidden",
    default: thisHook.context.params[2]
  };

  data.schema["blockType"] = {
    type: "hidden",
    default: thisHook.context.params[1]
  };

  data.form = [
    {
      "type": "help",
      "helpvalue": "<div class='alert alert-danger'>Are you sure you want to delete this form?</div>"
    },
    {
      "type": "button",
      "value": "delete",
      "title": "Delete block ",
      "htmlClass": "btn-danger"
    }
  ];

  thisHook.pass(data);

});

iris.modules.blocks.registerHook("hook_form_submit__blockDeleteForm", 0, function (thisHook, data) {

  if (iris.modules.blocks.globals.blocks[thisHook.context.params.blockType] && iris.modules.blocks.globals.blocks[thisHook.context.params.blockType][thisHook.context.params.blockTitle]) {

    delete iris.modules.blocks.globals.blocks[thisHook.context.params.blockType][thisHook.context.params.blockTitle];

  }

  iris.deleteConfig("blocks/" + thisHook.context.params.blockType, iris.sanitizeName(thisHook.context.params.blockTitle), function (err) {

    var data = function (res) {

      res.json({
        redirect: "/admin/blocks"
      });

    };

    thisHook.pass(data);

  });

});

// Default form submit for block forms

iris.modules.blocks.registerHook("hook_form_submit", 0, function (thisHook, data) {

  var formId = thisHook.context.formid;

  if (formId.split("_")[0] === "blockForm") {

    thisHook.context.params.blockTitle = iris.sanitizeName(thisHook.context.params.blockTitle);

    if (!iris.modules.blocks.globals.blocks[thisHook.context.params.blockType]) {

      iris.modules.blocks.globals.blocks[thisHook.context.params.blockType] = {};

    }

    iris.modules.blocks.globals.blocks[thisHook.context.params.blockType][thisHook.context.params.blockTitle] = thisHook.context.params;

    iris.saveConfig(thisHook.context.params, "blocks" + "/" + thisHook.context.params.blockType, iris.sanitizeName(thisHook.context.params.blockTitle), function () {

      var data = function (res) {

        res.json({
          redirect: "/admin/blocks"
        })

      }

      thisHook.pass(data);

    });

  } else {

    thisHook.pass(data);

  }

});

// Admin page routing handler

iris.route.get("/admin/blocks", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: "/admin/structure",
    title: "Blocks"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_blockslist"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
    blockTypes: Object.keys(iris.modules.blocks.globals.blockTypes),
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})
