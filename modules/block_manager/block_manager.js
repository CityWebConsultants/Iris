C.registerModule("block_manager");

CM.block_manager.globals.blockTypes = {};

// General registerType handler
CM.block_manager.registerHook("hook_block_registerType", 100, function (thisHook, data) {

  // Add to global object of blockTypes
  CM.block_manager.globals.blockTypes[thisHook.const.type] = thisHook.const;

  // Automatically register form
  CM.forms.globals.makeForm("block_" + thisHook.const.type, thisHook.const.schema);

  thisHook.finish(true, data);

});

// Add hidden fields to block forms
CM.block_manager.registerHook("hook_form_schema_alter", 0, function (thisHook, data) {

  if (thisHook.const.name.indexOf("block_" === 0)) {

    thisHook.const.schema.blockid = {};
    thisHook.const.schema.blocktype = {};

    thisHook.const.schema.blockid = {
      type: 'hidden',
      default: thisHook.const.context.custom.customForm.id
    };

    thisHook.const.schema.blocktype = {
      type: 'hidden',
      default: thisHook.const.context.custom.customForm.type
    };

    // Set defaults

    var existing = thisHook.const.context.custom.existing;

    for (var item in existing) {

      // If item exists on form
      if (thisHook.const.schema[item]) {

        thisHook.const.schema[item].default = existing[item];

      }

    }

  }

  thisHook.finish(true, data);

});

// Handle block form submission to update config

CM.block_manager.registerHook("hook_form_submit", 0, function (thisHook, data) {

  var blockId = thisHook.const.params.blockid;
  var blockType = thisHook.const.params.blocktype;

  // Remove form metadata
  delete thisHook.const.params.blockid;
  delete thisHook.const.params.formid;
  delete thisHook.const.params.blocktype;

      C.hook("hook_block_saveConfig", thisHook.authPass, {
        id: blockId,
        type: blockType,
        config: thisHook.const.params
      }).then(function () {

        res.respond(200, "Saved block");

      }, function (fail) {

        res.respond(500, fail);

      });

  thisHook.finish(true, "/admin/regions");

});

/* API ENDPOINTS */

// Return available blockTypes
C.app.get('/blockTypes/get', function (req, res) {

  res.respond(200, CM.block_manager.globals.blockTypes);

});

C.app.get('/block/get/:type/:id', function (req, res) {

  // expect block type and id

  C.hook("hook_block_loadConfig", req.authPass, {
    type: req.params.type,
    id: req.params.id
  }).then(function (config) {

    res.respond(200, config);

  }, function (fail) {

    res.respond(500, fail);

  });

});

C.app.post('/block/save', function (req, res) {

  // expect block id, type, config

  C.hook("hook_block_saveConfig", req.authPass, {
    id: req.body.id,
    type: req.body.type,
    config: req.body.config
  }).then(function () {

    res.respond(200, "Saved block");

  }, function (fail) {

    res.respond(500, fail);

  });

});

// Register an example type
C.hook("hook_block_registerType", "root", {
  name: 'Example block',
  type: 'example',
  schema: {
    title: {
      type: 'string',
      title: 'Title',
      required: true
    },
    text: {
      type: 'string',
      title: 'Text to display'
    }
  }

}).then(function (block) {

}, function (fail) {

  console.log(fail);

});
