C.registerModule("blocks");

CM.blocks.globals.blockTypes = {};

// Object in which to store all blocks

CM.blocks.globals.blocks = {};

var fs = require('fs');
var glob = require("glob");

// Function for registering system blocks

CM.blocks.globals.registerBlock = function (config) {

  if (!CM.blocks.globals.blocks[config.type]) {

    CM.blocks.globals.blocks[config.type] = {};

  }

  CM.blocks.globals.blocks[config.type][config.id] = config;

}

// Read all blocks saved by the user

glob(C.configPath + "/blocks/*/*.json", function (er, files) {

  var blocks = [];

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    try {

      config = JSON.parse(config);

      if (config.id && config.type) {

        // Make object for block type if it doesn't already exist

        if (!CM.blocks.globals.blocks[config.type]) {

          CM.blocks.globals.blocks[config.type] = {};

        }

        blocks.push(config.id);

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

CM.blocks.globals.registerBlockType = function (name, schema) {

  if (!name) {

    C.log("error", "block types must have a name")

  } else if (!schema) {

    C.log("error", "block types must have a form schema")

  } else {

    // Add to global object of blockTypes
    CM.blocks.globals.blockTypes[thisHook.const.type] = thisHook.const;

    // Automatically register form
    CM.blocks.globals.makeForm("block_" + thisHook.const.type, thisHook.const.schema);

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
