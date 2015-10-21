C.registerModule("admin_ui");

// Register templates folder
CM.frontend.globals.templateRegistry.external.push(__dirname + '/templates');

require('./admin_modules.js');

require('./admin_routing.js');

CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/entities', 'Entities');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/regions', 'Regions');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/permissions', 'Permissions');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin/logs', 'Logs');
