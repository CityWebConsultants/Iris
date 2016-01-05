/**
 * @file General hooks and functions for the admin system.
 */

iris.registerModule("admin_ui");

require('./admin_modules.js');

require('./admin_routing.js');

iris.modules.menu.globals.registerMenu("admin-toolbar");

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/", "Home", 0);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/entities", "Entities", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/structure", "Structure", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", "/admin/structure", "/admin/regions", "Regions", 1);
iris.modules.menu.globals.registerMenuLink("admin-toolbar", "/admin/structure", "/admin/blocks", "Blocks", 1);
iris.modules.menu.globals.registerMenuLink("admin-toolbar", "/admin/structure", "/admin/menu", "Menus", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/config", "Config", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", "/admin/config", "/admin/config/export", "Export config", 1);
iris.modules.menu.globals.registerMenuLink("admin-toolbar", "/admin/config", "/admin/config/import", "Import config", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/modules", "Modules", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/permissions", "Permissions", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/logs", "Logs", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/logout", "Log Out", 6);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/restart", "Restart server", 5);

iris.modules.auth.globals.registerPermission("can view admin menu", "admin");

iris.modules.admin_ui.registerHook("hook_menu_view", 1, function (thisHook, menuName) {

  if (menuName !== "admin-toolbar") {

    thisHook.finish(true, menuName);

    return false;

  }

  if (iris.modules.auth.globals.checkPermissions(["can view admin menu"], thisHook.authPass)) {

    thisHook.finish(true, menuName);

  } else {

    thisHook.finish(false, menuName);

  }

});

iris.modules.admin_ui.registerHook("hook_form_render_restart", 0, function (thisHook, data) {

  data.onSubmit = function (errors, values) {

    $.post(window.location, values, function (data, err) {

      window.location.href = window.location.href;

    });

  }

  thisHook.finish(true, data);

});

iris.modules.admin_ui.registerHook("hook_form_submit_restart", 0, function (thisHook, data) {

  iris.restart(thisHook.authPass.userid, "restart button");

  thisHook.finish(true, data);

});

// Admin menu view

// Default menu view function

iris.modules.admin_ui.registerHook("hook_view_menu", 0, function (thisHook, data) {

  if (thisHook.const === "admin-toolbar") {

    if (thisHook.authPass.roles.indexOf("admin") === -1) {

      thisHook.finish(false, data);

    } else {

      thisHook.finish(true, data);

    }

  } else {

    thisHook.finish(true, data);

  }

})

// Placeholder hook TODO for sending socket message to update log page

iris.modules.admin_ui.registerHook("hook_log", 0, function (thisHook, data) {

  // Loop over users to see if they have the view log permission

  Object.keys(iris.modules.auth.globals.userList).forEach(function (user) {

    var token = Object.keys(iris.modules.auth.globals.userList[user].tokens)[0];

    iris.modules.auth.globals.credentialsToPass({
      userid: user,
      token: token
    }).then(function (authPass) {

      //      console.log(authPass);

    });

  });

  thisHook.finish(true, data);

});
