var fs = require('fs');

CM.frontend.globals.themeRegions = function () {

  try {

    var themeRegions = fs.readFileSync(C.sitePath + '/' + C.config.theme + '/regions.json', 'utf8');

    return JSON.parse(themeRegions);

  } catch (e) {

    console.log("Could not read regions.json");

    return false;

  }

};

// Return list of available regions

C.app.get("/regions/list", function (req, res) {

  if (!CM.auth.globals.checkPermissions(['can view regions configuration'], req.authPass)) {

    res.respond(403, "Can't view regions configuration");
    return false;

  }

  var themeRegions = CM.frontend.globals.themeRegions();

  if (themeRegions) {

    res.respond(200, themeRegions);

  } else {

    res.respond(500, "Could not load theme regions");

  }

});

// Return regions with their config

C.app.get("/regions/get", function (req, res) {

  if (!CM.auth.globals.checkPermissions(['can view regions configuration'], req.authPass)) {

    res.respond(403, "Can't view regions configuration");
    return false;

  }

  res.respond(200, CM.frontend.globals.getRegions());

});

C.app.post("/regions/save/:region", function (req, res) {

  if (!CM.auth.globals.checkPermissions(['can update regions'], req.authPass)) {

    res.respond(403, "Can't update regions");
    return false;

  }

  var existingRegions = CM.frontend.globals.themeRegions();

  var regionName = req.params.region;
  var regionConfig = req.body.region;

  if (typeof regionConfig === 'object') {

    if (existingRegions.indexOf(regionName) !== -1) {

      try {

        fs.writeFileSync(C.sitePath + '/' + C.config.theme + '/regions/' + regionName + '.json', JSON.stringify(regionConfig), 'utf8');

        res.respond(200, regionConfig);

      } catch (e) {

        res.respond(500, "Could not write to region file");

      }

    }

  } else {

    res.respond(400, "Region to save is not an object");

  }

});

CM.frontend.globals.getRegions = function () {

  var regionFiles = fs.readdirSync(C.sitePath + '/' + C.config.theme + "/regions");

  var regionNames = CM.frontend.globals.themeConfig().regions;

  var regions = {};

  regionNames.forEach(function (name) {

    regions[name] = {};

  });

  regionFiles.forEach(function (regionFile) {

    if (regionNames.indexOf(regionFile.replace(".json", "")) !== -1) {

      try {

        var file = fs.readFileSync(C.sitePath + '/' + C.config.theme + "/regions" + '/' + regionFile, "utf8");

        regions[regionFile.replace(".json", "")] = JSON.parse(file);

      } catch (e) {

        console.log("Could not read region file " + regionFile);

      }

    }

  });

  return regions;

};
