var fs = require('fs');

C.registerModule("regions");

CM.forms.registerHook("hook_form_render_regions", 0, function (thisHook, data) {

  // Loop over available block types and add their blocks to a list for the form

  var blocks = [];

  Object.keys(CM.blocks.globals.blocks).forEach(function (blockType) {

    Object.keys(CM.blocks.globals.blocks[blockType]).forEach(function (block) {

      blocks.push(block + "|" + blockType)

    })

  });

  // Get a list of regions

  try {

    var themeSettings = fs.readFileSync(C.sitePath + "/" + C.config.theme + "/theme.json", "utf8");

    themeSettings = JSON.parse(themeSettings);

    var regions = themeSettings.regions;

    var form = {};

    // Push in N/A option

    blocks.push("None");

    blocks.reverse();

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

// Load regions

CM.regions.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("region", data.html, function (region, next) {

    var regionName = region[0];

    // Get list of regions

    C.readConfig("regions", "regions").then(function (output) {

        if (output[regionName]) {

          // Render each block in the region

          var blockPromises = [];
          var blockData = {};

          output[regionName].forEach(function (block) {

            if (block === "none") {

              return false;

            }

            var blockName = block.split("|")[0],
              blockType = block.split("|")[1];

            if (!blockData[blockType]) {

              blockData[blockType] = {};

            }

            var paramaters = {
              id: blockName,
              type: blockType,
              config: CM.blocks.globals.blocks[blockType][blockName]
            }

            blockPromises.push(function (object) {

              return new Promise(function (yes, no) {

                C.hook("hook_block_render", thisHook.authPass, paramaters, null).then(function (html) {

                  blockData[blockType][blockName] = html;

                  yes(blockData);

                });

              })

            })


          })

          C.promiseChain(blockPromises, {}, function (pass) {

            // Run parse template file for a regions template

            CM.frontend.globals.parseTemplateFile(["regions"], null, {
              blocks: pass
            }, thisHook.authPass, null).then(function (success) {

              next(success);

            }, function (fail) {

              next(false);

              C.log("error", e);

            });

          }, function (fail) {

            next(false);

          });

        } else {

          next(false);

        }

      },
      function (fail) {

        next(false);

      });

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data)

  }, function (fail) {

    thisHook.finish(true, data)

  });

});
