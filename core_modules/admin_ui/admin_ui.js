C.registerModule("admin_ui");

require('./admin_modules.js');

require('./admin_routing.js');

CM.menu.globals.registerMenu("admin-toolbar");

CM.menu.globals.registerMenuLink("admin-toolbar", null, "/", "Home");

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

  data.onSubmit = function (errors, values) {

    $.post(window.location, values, function (data, err) {

      $("#restart").remove();
      $(".restart-information").text("Refresh this page to restart another time.")

    })

  };

  thisHook.finish(true, data);

});

CM.admin_ui.registerHook("hook_form_submit_restart", 0, function (thisHook, data) {

  process.send("restart");

  setTimeout(function () {

    data = function (res) {

      res.send("/");

    };

  }, 5000);

  thisHook.finish(true, data);

});

// Admin menu view

// Default menu view function

CM.admin_ui.registerHook("hook_view_menu", 0, function (thisHook, data) {

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