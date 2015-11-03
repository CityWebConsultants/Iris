C.registerModule("admin_ui");

// Register templates folder
CM.frontend.globals.templateRegistry.external.push(__dirname + '/templates');

require('./admin_modules.js');

require('./admin_routing.js');

CM.menu.globals.registerMenuItem('admin_toolbar', '/admin2/entities', 'Entities');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin2/regions', 'Regions');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin2/permissions', 'Permissions');
CM.menu.globals.registerMenuItem('admin_toolbar', '/admin2/logs', 'Logs');
CM.menu.globals.registerMenuItem('admin_toolbar', '/logout', 'Log Out');
