C.registerModule("admin_ui");

// Register templates folder
CM.frontend.globals.templateRegistry.external.push(__dirname + '/templates');

require('./admin_forms.js');

require('./admin_routing.js');
