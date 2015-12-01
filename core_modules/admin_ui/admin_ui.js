C.registerModule("admin_ui");

require('./admin_modules.js');

require('./admin_routing.js');

CM.menu.globals.registerMenu("admin-toolbar");

CM.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/entities", "Entities");

CM.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/structure", "Structure");

CM.menu.globals.registerMenuLink("admin-toolbar", "/admin/structure", "/admin/regions", "Regions");
CM.menu.globals.registerMenuLink("admin-toolbar", "/admin/structure", "/admin/blocks", "Blocks");
CM.menu.globals.registerMenuLink("admin-toolbar", "/admin/structure", "/admin/menu", "Menus");

CM.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/config", "Config");

CM.menu.globals.registerMenuLink("admin-toolbar", "/admin/config", "/admin/config/export", "Export config");
CM.menu.globals.registerMenuLink("admin-toolbar", "/admin/config", "/admin/config/import", "Import config");

CM.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/permissions", "Permissions");

CM.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/logs", "Logs");
CM.menu.globals.registerMenuLink("admin-toolbar", null, "/logout", "Log Out");

CM.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/restart", "Restart server");

CM.auth.globals.registerPermission("can view admin menu", "admin");

CM.admin_ui.registerHook("hook_menu_view", 1, function (thisHook, menuName) {

  if (menuName !== "admin-toolbar") {

    thisHook.finish(true, menuName);

    return false;

  }

  if (CM.auth.globals.checkPermissions(["can view admin menu"], thisHook.authPass)) {

    thisHook.finish(true, menuName);

  } else {

    thisHook.finish(false, menuName);

  }

});

CM.admin_ui.registerHook("hook_form_render_restart", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.admin_ui.registerHook("hook_form_submit_restart", 0, function (thisHook, data) {
  
  process.send("restart");

  data = function (res) {

    res.send("/");

  };

  thisHook.finish(true, data);

});
