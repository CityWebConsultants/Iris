var fs = require('fs');

CM.frontend.globals.displayErrorPage = function (code, req, res) {

  C.hook("hook_display_error_page", req.authPass, {
    error: code,
    req: req,
    res: res
  }).then(function (success) {

    res.status(code).send(success);

  }, function (fail) {

    res.status(code).send(code.toString());

  });

};

C.app.get("/admin/config/export", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_export_config"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});

C.app.get("/admin/config/import", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_import_config"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});

C.app.get("/admin/blocks", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_blockslist"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks,
    blockTypes: Object.keys(CM.blocks.globals.blockTypes),
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/regions", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_regions"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_dashboard"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/permissions", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_permissions"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/entities", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_entity_types"], ['admin_wrapper'], {
    entityTypes: Object.keys(C.dbCollections)
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/logs", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  var rawLogs = fs.readFileSync(C.sitePath + '/' + "/logs/main.log", "utf8");

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

  CM.frontend.globals.parseTemplateFile(["admin_logs"], ['admin_wrapper'], {
    logs: logs.reverse(),
    keys: keys
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/schema/create", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_schema_create"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/schema/edit/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_schema_edit"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/edit/:type/:eid", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_entity_edit"], ['admin_wrapper'], {
    eid: req.params.eid,
    type: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/create/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_entity_create"], ['admin_wrapper'], {
    type: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/delete/:type/:id", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_entity_delete"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

C.app.get("/admin/entitylist/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.admin_ui.globals.prepareEntitylist(req.params.type, function (output) {

    CM.frontend.globals.parseTemplateFile(["admin_entitylist"], ['admin_wrapper'], {
      entities: output.entities,
      type: req.params.type
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      CM.frontend.globals.displayErrorPage(500, req, res);

      C.log("error", e);

    });

  })

})

// Structure page

C.app.get("/admin/structure/", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Load in admin menu

  var structureMenu = {};

  if (C.configStore["menu"]["admin-toolbar"]) {

    C.configStore["menu"]["admin-toolbar"].items.forEach(function (item) {

      if (item.path === "/admin/structure") {

        structureMenu = item;

      }

    })

  }

  CM.frontend.globals.parseTemplateFile(["admin_structure"], ['admin_wrapper'], {
    structureMenu: structureMenu
  }, req.authPass, req).then(function (success) {
    res.send(success)
  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

// Config page

C.app.get("/admin/config/", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Load in admin menu

  var structureMenu = {};

  if (C.configStore["menu"]["admin-toolbar"]) {

    C.configStore["menu"]["admin-toolbar"].items.forEach(function (item) {

      if (item.path === "/admin/config") {

        configMenu = item;

      }

    })

  }

  CM.frontend.globals.parseTemplateFile(["admin_config"], ['admin_wrapper'], {
    configMenu: configMenu
  }, req.authPass, req).then(function (success) {
    res.send(success)
  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

// Restart page

C.app.get("/admin/restart", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_restart"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})
