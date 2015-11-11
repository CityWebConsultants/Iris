var fs = require('fs');

CM.forms.registerHook("hook_form_render_regions", 0, function (thisHook, data) {

  // Loop over available block types and add their blocks to a list for the form

  var blocks = [];

  Object.keys(CM.blocks.globals.blocks).forEach(function (blockType) {

    Object.keys(CM.blocks.globals.blocks[blockType]).forEach(function (block) {

      blocks.push(block);

    })

  });

  // Get a list of regions

  try {

    var themeSettings = fs.readFileSync(C.sitePath + "/" + C.config.theme + "/theme.json", "utf8");

    themeSettings = JSON.parse(themeSettings);

    var regions = themeSettings.regions;

    var form = {};

    regions.forEach(function (regionName) {

      form[regionName] = {
        "type": "array",
        "title": regionName.toUpperCase(),
        "items": {
          "type": "string",
          "enum": blocks
        }
      }

    })

    data.schema = form;

    // Load in past values

    C.readConfig("regions", "regions").then(function (output) {

      data.value = output;

      thisHook.finish(true, data);

    }, function (fail) {

      thisHook.finish(true, data);

    });

  } catch (e) {

    console.log(e);
    thisHook.finish(true, data);

  }

  thisHook.finish(true, data);

});

CM.forms.registerHook("hook_form_submit_regions", 0, function (thisHook, data) {

  try {

    C.saveConfig(thisHook.const.params, "regions", "regions", function () {

      thisHook.finish(true, data);

    });

  } catch (e) {

    console.log(e);

  }

});
