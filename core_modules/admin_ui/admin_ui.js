C.registerModule("admin_ui");

require('./admin_modules.js');

require('./admin_routing.js');

CM.menu.globals.registerMenu("admin_toolbar");

CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/entities", "Entities");

CM.menu.globals.registerMenuLink("admin_toolbar", "/admin/entities", "/admin/test", "Test");

CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/regions", "Regions");
CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/blocks", "Blocks");
CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/permissions", "Permissions");
CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/menu", "Menus");
CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/config/export", "Export config");
CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/config/import", "Import config");
CM.menu.globals.registerMenuLink("admin_toolbar", null, "/admin/logs", "Logs");
CM.menu.globals.registerMenuLink("admin_toolbar", null, "/logout", "Log Out");

CM.auth.globals.registerPermission("can view admin menu", "admin");

CM.admin_ui.registerHook("hook_menu_view", 1, function (thisHook, menuName) {

  if (menuName !== "admin_toolbar") {

    thisHook.finish(true, menuName);

    return false;

  }

  if (CM.auth.globals.checkPermissions(["can view admin menu"], thisHook.authPass)) {

    thisHook.finish(true, menuName);

  } else {

    thisHook.finish(false, menuName);

  }

});
