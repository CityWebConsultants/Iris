/**
 * @file Admin forms to import and export system configurations.
 */

var ncp = require('ncp').ncp;
var fs = require('fs');
var glob = require("glob");
var path = require("path");

/**
 * Define callback routes.
 */
var routes = {
  export : {
    title: "Config export",
    description: "Export system configurations.",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: "/admin/config",
      title: "Export"
    }]
  },
  import : {
    title: "Config import",
    description: "Import system configurations.",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: "/admin/config",
      title: "Import"
    }]
  },
  config : {
    title: "Configurations",
    description: "System configurations.",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: null,
      title: "Config"
    }]
  },
  diff : {
    title: "Diff",
    description: "Show the difference between current and staging configurations.",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: "/admin/config",
      title: "Diff"
    }]
  }
}

/**
 * Admin API callback: Export configurations.
 */
iris.route.get("/admin/api/config/export", {}, function (req, res) {

  ncp(iris.configPath, iris.sitePath + "/staging", function (err) {
    if (err) {
      return console.error(err);
    }
    res.send(req.authPass.t("Config exported"));
  });

});

/**
 * Admin API callback: Import configurations.
 */
iris.route.get("/admin/api/config/import", {}, function (req, res) {

  ncp(iris.sitePath + "/staging", iris.configPath, function (err) {
    if (err) {
      return console.error(err);
    }
    res.send(req.authPass.t("Config imported"));
  });

});

/**
 * Admin page callback: Export configurations.
 */
iris.route.get("/admin/config/export", routes.export, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_export_config"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Admin page callback: Import configurations.
 */
iris.route.get("/admin/config/import", routes.import, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_import_config"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Admin page callback: Diff of config.
 */
iris.route.get("/admin/config/diff", routes.diff, function (req, res) {

  var current = "Empty";
  var staging = "Empty";

  try {

    current = fs.readFileSync(iris.configPath + req.query.path, "utf8")

  } catch (e) {


  }

  try {

    staging = fs.readFileSync(iris.sitePath + "/staging" + req.query.path, "utf8")

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

/**
 * Admin page callback: Show config differences.
 */
iris.route.get("/admin/config", routes.config, function (req, res) {

  // Get list of config clashes

  showConfigDiff(function (clashes) {

    // If not admin, present 403 page

    if (req.authPass.roles.indexOf('admin') === -1) {

      iris.modules.frontend.globals.displayErrorPage(403, req, res);

      return false;

    }

    var fs = require('fs');

    var menu = iris.modules.menu.globals.getBaseLinks(req.url);

    iris.modules.frontend.globals.parseTemplateFile(["admin_config"], ['admin_wrapper'], {
      configMenu: menu,
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
