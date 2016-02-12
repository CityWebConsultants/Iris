/**
 * @file General hooks and functions for the admin system.
 */

iris.registerModule("system");

require('./system_routing.js');

iris.modules.menu.globals.registerMenu("admin-toolbar");

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/", "Home", 0);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/structure", "Structure", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/logs", "Logs", 1);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/logout", "Log Out", 6);

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/restart", "Restart server", 5);

iris.modules.auth.globals.registerPermission("can view admin menu", "admin");

iris.modules.auth.globals.registerPermission("can access admin pages", "admin");

require('./system_modules.js');



iris.modules.system.registerHook("hook_form_render_restart", 0, function (thisHook, data) {

  data.onSubmit = function (errors, values) {

    $.post(window.location, values, function (data, err) {

      window.location.href = window.location.href;

    });

  }

  thisHook.finish(true, data);

});

iris.modules.system.registerHook("hook_form_submit_restart", 0, function (thisHook, data) {

  iris.restart(thisHook.authPass.userid, "restart button");

  thisHook.finish(true, data);

});


// Placeholder hook TODO for sending socket message to update log page

iris.modules.system.registerHook("hook_log", 0, function (thisHook, data) {

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
