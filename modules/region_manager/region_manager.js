C.registerModule("region_manager");

CM.region_manager.registerHook("hook_regions_load", 0, function (thisHook, data) {

  C.hook("hook_regions_loadConfig", thisHook.authPass, thisHook.const, data).then(function (config) {

    thisHook.finish(true, config);

  }, function (fail) {

    thisHook.finish(false, "Could not load regions config");

  });

});

CM.region_manager.registerHook("hook_regions_loadConfig", 0, function (thisHook, data) {

  C.readConfig('region_manager', 'regions').then(function (output) {

    thisHook.finish(true, output);

  }, function (fail) {

    thisHook.finish(true, data);

  });

});

CM.region_manager.registerHook("hook_regions_save", 0, function (thisHook, data) {

  C.hook("hook_regions_saveConfig", thisHook.authPass, thisHook.const, data).then(function (savedConfig) {

    thisHook.finish(true, savedConfig);

  }, function (fail) {

    thisHook.finish(false, "Could not save regions config");

  });

});

CM.region_manager.registerHook("hook_regions_saveConfig", 0, function (thisHook, data) {

  var regionConfig = thisHook.const;

  C.saveConfig(regionConfig, "region_manager", "regions", function () {

    thisHook.finish(true, data);

  });

});

/* API ENDPOINTS */

// Get full structure of available regions and their blocks
C.app.get("/regions/get", function (req, res) {

  // Expect no parameters

  C.hook("hook_regions_load", req.authPass).then(function (regions) {

    res.respond(200, regions);

  }, function (fail) {

    res.respond(500, fail);

  });

});

// Save full structure of available regions and their blocks
C.app.post("/regions/save", function (req, res) {

  // Expect {regions: full JSON regions configuration}

  C.hook("hook_regions_save", req.authPass, req.body.regions).then(function (savedRegions) {

    res.respond(200, savedRegions);

  }, function (fail) {

    res.respond(500, fail);

  });

});


