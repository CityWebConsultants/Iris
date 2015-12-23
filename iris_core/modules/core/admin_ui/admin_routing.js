var fs = require('fs');

iris.modules.frontend.globals.displayErrorPage = function (code, req, res) {

  iris.hook("hook_display_error_page", req.authPass, {
    error: code,
    req: req,
    res: res
  }).then(function (success) {

    res.status(code).send(success);

  }, function (fail) {

    res.status(code).send(code.toString());

  });

};

iris.app.get("/admin/config/export", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_export_config"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.app.get("/admin/config/import", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_import_config"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.app.get("/admin/blocks", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_blockslist"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
    blockTypes: Object.keys(iris.modules.blocks.globals.blockTypes),
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/regions", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_regions"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_dashboard"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/permissions", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_permissions"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/entities", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity_types"], ['admin_wrapper'], {
    entityTypes: Object.keys(iris.dbCollections)
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/logs", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  var rawLogs = fs.readFileSync(iris.sitePath + '/' + "/logs/main.log", "utf8");

  //Remove last line

  rawLogs = rawLogs.replace(/\n$/, "");

  //Split logs by newline

  var logs = rawLogs.split(/\r?\n/)

  logs.forEach(function (element, index) {

    logs[index] = JSON.parse(logs[index]);

  });

  if (logs[0]) {

    keys = Object.keys(logs[0]);

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_logs"], ['admin_wrapper'], {
    logs: logs.reverse(),
    keys: keys
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/schema/create", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_create"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/schema/edit/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_edit"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/edit/:type/:eid", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity_edit"], ['admin_wrapper'], {
    eid: req.params.eid,
    type: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/create/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity_create"], ['admin_wrapper'], {
    type: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/delete/:type/:id", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity_delete"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/entitylist/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.admin_ui.globals.prepareEntitylist(req.params.type, function (output) {

    iris.modules.frontend.globals.parseTemplateFile(["admin_entitylist"], ['admin_wrapper'], {
      entities: output.entities,
      type: req.params.type
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", e);

    });

  })

})

// Structure page

iris.app.get("/admin/structure/", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Load in admin menu

  var structureMenu = {};

  if (iris.configStore["menu"]["admin-toolbar"]) {

    iris.configStore["menu"]["admin-toolbar"].items.forEach(function (item) {

      if (item.path === "/admin/structure") {

        structureMenu = item;

      }

    })

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_structure"], ['admin_wrapper'], {
    structureMenu: structureMenu
  }, req.authPass, req).then(function (success) {
    res.send(success)
  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

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
      lang: "auto"
    },
    output = prettydiff.api(args);
  
  res.send(output[0]);

});

// Config page

iris.app.get("/admin/config/", function (req, res) {

  // Get list of config clashes

  showConfigDiff(function (clashes) {

    // If not admin, present 403 page

    if (req.authPass.roles.indexOf('admin') === -1) {

      iris.modules.frontend.globals.displayErrorPage(403, req, res);

      return false;

    }

    // Load in admin menu

    var structureMenu = {};

    if (iris.configStore["menu"]["admin-toolbar"]) {

      iris.configStore["menu"]["admin-toolbar"].items.forEach(function (item) {

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

      iris.log("error", e);

    });

  });

})

// Restart page

iris.app.get("/admin/restart", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_restart"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})
