var fs = require('fs');

CM.frontend.globals.displayErrorPage = function (code, req, res) {

  C.hook("hook_display_error_page", req.authPass, {
    error: 403,
    req: req,
    res: res
  }).then(function (success) {

    res.status(403).send(success);

  }, function (fail) {

    res.status(403).send("403");

  });

};

C.app.get("/admin/blocks", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_blockslist"], ['admin_wrapper'], {
    blocks: CM.blocks.globals.blocks,
    hello: "world"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

//CM.admin_ui.globals.registerPath("/admin/regions", "admin_regions");
//CM.admin_ui.globals.registerPath("/admin/login", "admin_login");
//CM.admin_ui.globals.registerPath("/admin", "admin_dashboard");
//CM.admin_ui.globals.registerPath("/admin/permissions", "admin_permissions");
//CM.admin_ui.globals.registerPath("/admin/entities", "admin_entity_types");
//CM.admin_ui.globals.registerPath("/admin/entitylist/:type", "admin_entitylist", CM.admin_ui.globals.prepareEntitylist);
//CM.admin_ui.globals.registerPath("/admin/schema/create", "admin_schema_create");
//CM.admin_ui.globals.registerPath("/admin/schema/edit/:type", "admin_schema_edit");
//CM.admin_ui.globals.registerPath("/admin/edit/:type/:_id", "admin_entity_edit");
//CM.admin_ui.globals.registerPath("/admin/create/:type", "admin_entity_create");
//CM.admin_ui.globals.registerPath("/admin/delete/:type/:id", "admin_entity_delete");
//CM.admin_ui.globals.registerPath("/admin/logs", "admin_logs");
