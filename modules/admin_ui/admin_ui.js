C.registerModule("admin_ui");

// Register templates folder
CM.frontend.globals.templateRegistry.external.push(__dirname + '/templates');

require('./admin_modules.js');

require('./admin_routing.js');

CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/entities', 'Entities');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/regions', 'Regions');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/permissions', 'Permissions');

CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/config/export', 'Export config');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/config/import', 'Import config');

CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/logs', 'Logs');
CM.menu.globals.registerMenuItem('admin_toolbar', '/logout', 'Log Out');


CM.auth.globals.registerPermission("can view admin menu", "admin");

CM.admin_ui.registerHook("hook_menu_view", 1, function (thisHook, menuName) {

  if (CM.auth.globals.checkPermissions(["can view admin menu"], thisHook.authPass)) {

    thisHook.finish(true, true);

  } else {

    thisHook.finish(false, false);

  }

});
