var fs = require('fs');

// Regions configuration page

C.app.get('/admin2/regions', function (req, res) {

  if (req.authPass.roles.indexOf("admin") === -1) {

    res.redirect("/admin2/login?return=/admin2/regions");
    return false;

  }

  var page = fs.readFileSync(__dirname + "/../templates/admin_regions_list.html", "utf8");

  CM.frontend.globals.parseTemplate(page, req.authPass).then(function (page) {

    res.send(page.html);

  });

});

C.app.get('/admin2/block/create/:type', function (req, res) {

  if (req.authPass.roles.indexOf("admin") === -1) {

    res.redirect("/admin");
    return false;

  }

  var page = fs.readFileSync(__dirname + "/../templates/admin_block_edit.html", "utf8");

  page = page.split("[[blockformtitle]]").join("Create new " + req.params.type + " block");
  page = page.split("[[blockform]]").join('block_' + req.params.type);

  C.hook("hook_regions_load", req.authPass).then(function (regions) {

    CM.frontend.globals.parseTemplate(page, req.authPass, {
      custom: {
        customForm: {
          type: req.params.type,
          regions: regions
        },
        isExisting: false
      }
    }).then(function (page) {

      res.send(page.html);

    }, function (fail) {

      console.log(fail);

    });

  }, function (fail) {

    res.send("Could not load regions");

  });

});

C.app.get('/admin2/block/edit/:type/:id', function (req, res) {

  if (req.authPass.roles.indexOf("admin") === -1) {

    res.redirect("/admin");
    return false;

  }

  var page = fs.readFileSync(__dirname + "/../templates/admin_block_edit.html", "utf8");

  // Fetch block

  var blockConfig;

  C.hook("hook_block_loadConfig", req.authPass, {
    type: req.params.type,
    id: req.params.id
  }).then(function (config) {

    if (config === "Could not load block") {

      // Block doesn't exist

    }

    page = page.split("[[blockformtitle]]").join("Edit block " + req.params.id);
    page = page.split("[[blockform]]").join('block_' + req.params.type);

    CM.frontend.globals.parseTemplate(page, req.authPass, {
      custom: {
        customForm: {
          type: req.params.type,
          id: req.params.id
        },
        isExisting: true,
        existing: config.config
      }
    }).then(function (page) {

      res.send(page.html);

    });

  }, function (fail) {

    res.send("Block could not be loaded");

  });

});
