C.registerModule("block_manager");

CM.block_manager.globals.blockTypes = {};

// General registerType handler
CM.block_manager.registerHook("hook_block_registerType", 100, function (thisHook, data) {

  // Add to global object of blockTypes
  CM.block_manager.globals.blockTypes[thisHook.const.type] = thisHook.const;

  // Automatically register form
  CM.forms.globals.makeForm("block_" + thisHook.const.type, thisHook.const.form);

  thisHook.finish(true, data);

});

CM.region_manager.registerHook("hook_block_loadConfig", 0, function (thisHook, data) {

  console.log("loadconfig", thisHook.const);

  var blockId = thisHook.const.id;
  var blockType = thisHook.const.type;

  C.readConfig(C.sitePath + '/' + C.config.theme + '/blocks', blockId).then(function (output) {

    console.log("read", output);

    thisHook.finish(true, data);

  }, function (fail) {

    console.log(fail);

    thisHook.finish(true, data);

  });

});

/* API ENDPOINTS */

// Return available blockTypes
C.app.get('/blockTypes/get', function (req, res) {

  res.respond(200, CM.block_manager.globals.blockTypes);

});

// Register an example type
C.hook("hook_block_registerType", "root", {
  name: 'Example block',
  type: 'example',
  form: {
    schema: {
      name: {
        type: 'string',
        title: 'Name',
        required: true
      },
      age: {
        type: 'number',
        title: 'Age'
      }
    }
  }
}).then(function (block) {

}, function (fail) {

  console.log(fail);

});
