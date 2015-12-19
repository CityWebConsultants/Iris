var fs = require('fs');

iris.registerModule("regions");

iris.modules.forms.registerHook("hook_form_render_regions", 0, function (thisHook, data) {

  // Loop over available block types and add their blocks to a list for the form

  var blocks = [];

  Object.keys(iris.modules.blocks.globals.blocks).forEach(function (blockType) {

    Object.keys(iris.modules.blocks.globals.blocks[blockType]).forEach(function (block) {

      blocks.push(block + "|" + blockType)

    })

  });

  // Get a list of regions

  try {

    var path = require("path");

    var themePath = path.resolve(iris.sitePath + '/../../' + iris.config.theme);

    var themeSettings = fs.readFileSync(themePath + "/theme.json", "utf8");

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
          "type": "object",
          "properties": {
            "block": {
              "type": "string",
              "enum": blocks
            },
            "settings": {
              "type": "object",
              "properties": {
                "pathVisibility": {
                  "type": "text",
                  "title": "Paths",
                  "description": "Paths this block is visible at"
                }

              }

            }


          },

        }
      }

    })

    Object.keys(form).forEach(function (property) {

      data.schema[property] = form[property];

    })

    // Load in past values

    iris.readConfig("regions", "regions").then(function (output) {

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

iris.modules.forms.registerHook("hook_form_submit_regions", 0, function (thisHook, data) {

  try {

    iris.saveConfig(thisHook.const.params, "regions", "regions", function () {

      thisHook.finish(true, data);

    });

  } catch (e) {

    console.log(e);

  }

});

// Load regions

iris.modules.regions.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  iris.modules.frontend.globals.parseBlock("region", data.html, function (region, next) {

    var regionName = region[0];

    // Get list of regions

    iris.readConfig("regions", "regions").then(function (output) {

        if (output[regionName]) {
          // Render each block in the region

          var blockPromises = [];
          var blockData = {};

          output[regionName].forEach(function (block, index) {

            var settings = block.settings;

            var block = block.block;

            if (block.toLowerCase() === "none") {

              return false;

            }

            var blockName = block.split("|")[0],
              blockType = block.split("|")[1];

            var paramaters = {
              index: index,
              id: blockName,
              type: blockType,
              instanceSettings: settings,
              config: iris.modules.blocks.globals.blocks[blockType][blockName],
              context: thisHook.const.context
            }

            blockPromises.push(function (object) {

              return new Promise(function (yes, no) {

                iris.hook("hook_block_render", thisHook.authPass, paramaters, null).then(function (html) {

                  blockData[blockType + "|" + blockName + "|" + index] = html;

                  yes(blockData);

                }, function (fail) {

                  yes("");

                });

              })

            })


          })

          iris.promiseChain(blockPromises, {}, function (pass) {

            // Run parse template file for a regions template

            iris.modules.frontend.globals.parseTemplateFile(["region", regionName], null, {
              blocks: pass
            }, thisHook.authPass, null).then(function (success) {

              next(success);

            }, function (fail) {

              next(false);

              iris.log("error", e);

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

// Block path visibility

iris.modules.regions.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.const.instanceSettings) {

    if (thisHook.const.instanceSettings.pathVisibility) {

      var visibility = thisHook.const.instanceSettings.pathVisibility.split(",");

      if (thisHook.const.context && thisHook.const.context.req && thisHook.const.context.req.url) {

        if (visibility.indexOf(thisHook.const.context.req.url) === -1 && visibility.indexOf("*") === -1) {

          thisHook.finish(false, data);

        } else {

          thisHook.finish(true, data);

        }


      } else {

        // No url, safer to not show

        thisHook.finish(false, data);

      }

    } else {

      thisHook.finish(true, data);

    }

  } else {

    thisHook.finish(true, data);

  }

});
