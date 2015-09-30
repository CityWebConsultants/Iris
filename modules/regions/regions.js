C.registerModule("regions");

// Implement hook_frontend_template_parse to handle [[[region name]]]
CM.regions.registerHook("hook_frontend_template_parse", 1, function (thisHook, data) {

  C.hook("hook_regions_load", thisHook.authPass).then(function (regions) {

    CM.frontend.globals.parseBlock("region", data.html, function (region, next) {

      C.hook("hook_region_render", thisHook.authPass, {
        regions: regions,
        region: region,
        context: thisHook.const.context
      }).then(function (html) {

        next(html);

      }, function (fail) {

        next("<!--- Could not load region " + region + " --->");

      });

    }).then(function (html) {

      data.html = html;

      thisHook.finish(true, data);

    }, function (fail) {

      thisHook.finish(false, fail);

    });

  });

});

// Extensible hook to render a region
CM.regions.registerHook("hook_region_render", 0, function (thisHook, data) {

  C.hook("hook_region_load", thisHook.authPass, thisHook.const).then(function (blocks) {

    CM.frontend.globals.findTemplate(["region", thisHook.const.region]).then(function (template) {

      C.hook("hook_frontend_template", thisHook.authPass, null, {
        html: template,
        vars: {
          blocks: blocks
        }
      }).then(function (success) {

        thisHook.finish(true, success.html);

      }, function (fail) {

        thisHook.finish(false, fail);

      });

    }, function (fail) {

      thisHook.finish(false, fail);

    });

  }, function (fail) {

    thisHook.finish(false, fail);

  });

});

CM.regions.registerHook("hook_region_load", 0, function (thisHook, data) {

  var region = thisHook.const.regions[thisHook.const.region];

  if (!region) {

    thisHook.finish(false, "Could not load region");
    return false;

  }

  var promises = [];

  var renderedBlocks = [];

  if (region.blocks) {

    region.blocks.forEach(function (block, index) {

      renderedBlocks[index] = {
        id: block.id,
        type: block.type
      };

      promises.push(

        C.promise(function (data, yes, no) {

          C.hook("hook_block_load", thisHook.authPass, {
            id: block.id,
            type: block.type,
            context: thisHook.const.context
          }).then(function (html) {

            renderedBlocks[index].html = html;

            yes(data);

          }, function (fail) {

            no(data);

          });

        })

      );

    });

    C.promiseChain(promises, data, function (success) {

      thisHook.finish(true, renderedBlocks);

    }, function (fail) {

      thisHook.finish(false, fail);

    });

  } else {

    thisHook.finish(true, []);

  }

});
