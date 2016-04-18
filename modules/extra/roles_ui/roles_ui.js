
/**
 * Define callback routes.
 */
var routes = {
  roles: {
    title: "Roles",
    description: "Manage role types",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: "/admin/users",
      title: "Roles"
    }]
  }
}

/**
 * Admin page callback: Roles.
 *
 * Manage role types.
 */
iris.route.get("/admin/users/roles", routes.roles, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["administer-roles"], ['admin_wrapper'], {

  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

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
    "description": thisHook.authPass.t("Default roles: anonymous, authenticated"),
    "default": rolesDefaults,
    "items": {
      "type": "object",
      "properties": {
        "roleName": {
          "type": "string",
          "title": thisHook.authPass.t("Name")
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
  iris.message(thisHook.authPass.userid, "Saved", "info");
  thisHook.pass(function (res) {
    res.send("/admin/users/roles");

  })

});
