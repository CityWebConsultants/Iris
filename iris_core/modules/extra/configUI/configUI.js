/**
 * @file Admin forms to import and export system configurations.
 */

var ncp = require('ncp').ncp;

iris.app.get("/admin/api/config/export", function (req, res) {

  ncp(iris.configPath, iris.sitePath + "/staging", function (err) {
    if (err) {
      return console.error(err);
    }
    res.send("Config exported")
  });

});

iris.app.get("/admin/api/config/import", function (req, res) {

  ncp(iris.sitePath + "/staging", iris.configPath, function (err) {
    if (err) {
      return console.error(err);
    }
    res.send("Config imported")
  });

});

iris.route.get("/admin/config", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Config"
  }]
}, function (req, res) {
  
  res.send("Config top level to go here.")
  
});

iris.route.get("/admin/config/export", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: "/admin/config",
    title: "Config export"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_export_config"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.route.get("/admin/config/import", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: "/admin/config",
    title: "Config import"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_import_config"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

// Show diffs between config files

iris.app.get("/admin/config/diff", function (req, res) {

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  var current = "Empty";
  var staging = "Empty";

  try {

    current = fs.readFileSync(iris.configPath + req.body.path, "utf8")

  } catch (e) {


  }

  try {

    staging = fs.readFileSync(iris.sitePath + "/staging" + req.body.path, "utf8")

  } catch (e) {

  }

  var prettydiff = require("prettydiff"),
    args = {
      source: current,
      diff: staging,
      lang: "json"
    },
    output = prettydiff.api(args);

  res.send(output[0]);

});

// Config page

iris.route.get("/admin/config", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Config"
  }]
}, function (req, res) {

  // Get list of config clashes

  showConfigDiff(function (clashes) {

    // If not admin, present 403 page

    if (req.authPass.roles.indexOf('admin') === -1) {

      iris.modules.frontend.globals.displayErrorPage(403, req, res);

      return false;

    }

    // Load in admin menu

    var structureMenu = {};

    if (iris.configStore["menu"]["admin_toolbar"]) {

      iris.configStore["menu"]["admin_toolbar"].items.forEach(function (item) {

        if (item.path === "/admin/config") {

          configMenu = item;

        }

      })

    }

    var fs = require('fs');

    iris.modules.frontend.globals.parseTemplateFile(["admin_config"], ['admin_wrapper'], {
      configMenu: configMenu,
      clashes: clashes
    }, req.authPass, req).then(function (success) {

      res.send(success);

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

  });

});

// Get diffs of config

var fs = require('fs');
var glob = require("glob");
var path = require("path");

var showConfigDiff = function (callback) {

  var output = [];

  var liveFiles = glob.sync(iris.configPath + "/**/*.json");
  var stagingFiles = glob.sync(iris.sitePath + "/staging" + "/**/*.json");

  liveFiles.forEach(function (file) {

    var tailPath = path.normalize(file).replace(path.normalize(iris.configPath), "");

    var liveConfig = fs.readFileSync(file, "utf8");

    var stagingLocation = path.normalize(iris.sitePath + "/staging" + tailPath);

    var stagingConfig = "";

    try {

      stagingConfig = fs.readFileSync(stagingLocation, "utf8");

    } catch (e) {

    }

    if (stagingConfig !== liveConfig) {

      output.push({
        file: tailPath
      });

    }

  })

  stagingFiles.forEach(function (file) {

    var tailPath = path.normalize(file).replace(path.normalize(iris.sitePath + "/staging/"), "");

    var stagingConfig = fs.readFileSync(file, "utf8");

    var liveLocation = path.normalize(iris.configPath + "/" + tailPath);

    var liveConfig = "";

    try {

      liveConfig = fs.readFileSync(liveLocation, "utf8");

    } catch (e) {

    }

    if (stagingConfig !== liveConfig) {

      output.push({
        file: tailPath
      });

    }

  })

  callback(output);

}
