iris.readConfig('auth', 'auth_roles').then(function (config) {

  // config is now accessible as a standard JavaScript object
  var roles = iris.modules.auth.globals.roles;

  for (key in config) {
    iris.modules.auth.globals.registerRole(key);
  }

}, function (fail) {

  if (fail.code === "ENOENT") {

    iris.log('info', "No additional roles loaded by roles_ui");

  } else {

    iris.log('error', fail);

  }

});

iris.route.get("/admin/users/roles", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: "/admin/users",
    title: "Roles"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["administer-roles"], ['admin_wrapper'], {

  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.modules.roles_ui.registerHook("hook_form_render__manageRoles", 0, function (thisHook, data) {


  var roles = iris.modules.auth.globals.roles;
  var rolesDefaults = [];

  delete roles.anonymous;
  delete roles.authenticated;
  for (key in roles) {
    rolesDefaults.push({
      "roleName": key
    });
  }

  data.schema.roles = {
    "type": "array",
    "title": "Roles",
    "description": "Default roles: anonymous, authenticated",
    "default": rolesDefaults,
    "items": {
      "type": "object",
      "properties": {
        "roleName": {
          "type": "string",
          "title": "Name"
        },
      }
    }
  };

  thisHook.pass(data);

});

iris.modules.roles_ui.registerHook("hook_form_submit__manageRoles", 0, function (thisHook, data) {

  var roles = iris.modules.auth.globals.roles;
  var formatRoles = {};
  var query = [];
  for (i = 0; i < thisHook.context.params.roles.length; i++) {
    formatRoles[thisHook.context.params.roles[i].roleName] = {
      "name": thisHook.context.params.roles[i].roleName
    }
  }
  iris.modules.auth.globals.roles = formatRoles;

  // Add defaults
  iris.modules.auth.globals.roles['anonymous'] = {
    "name": "anonymous"
  };
  iris.modules.auth.globals.roles['authenticated'] = {
    "name": "authenticated"
  };

  iris.saveConfig(formatRoles, 'auth', 'auth_roles');
  iris.message(thisHook.authPass.userid, "Saved", "notice");
  thisHook.pass(function (res) {
    res.send("/admin/users/roles");

  })

});
