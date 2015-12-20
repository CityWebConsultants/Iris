var fs = require('fs');

// Permissions form

iris.modules.admin_ui.registerHook("hook_form_render_permissions", 0, function (thisHook, data) {

  // Check if menu name supplied and previous values available

  var current = {};

  try {
    var currentPermissions = fs.readFileSync(iris.modules.auth.configPath + "/permissions.JSON", "utf8");

    current = JSON.parse(currentPermissions);

  } catch (e) {

    fs.writeFileSync(iris.modules.auth.configPath + "/permissions.JSON", JSON.stringify({}), "utf8");

  }

  var permissions = iris.modules.auth.globals.permissions;

  var roles = iris.modules.auth.globals.roles;

  var permissionSchema = {};
  var form = [];

  // Loop over each permission and add a schema item for it.

  // Categories first, later move these into fieldsets

  Object.keys(iris.modules.auth.globals.permissions).forEach(function (category) {

    var items = [];

    Object.keys(iris.modules.auth.globals.permissions[category]).forEach(function (permissionName) {

      var permission = iris.modules.auth.globals.permissions[category][permissionName].name;

      permissionSchema[permission] = {
        "type": "array",
        "title": permission.toUpperCase(),
        "description": iris.modules.auth.globals.permissions[category][permissionName].description,
        "items": {
          "type": "string",
          "enum": Object.keys(roles)
        }
      }

      items.push({
        "key": permission,
        "type": "checkboxbuttons",
        "activeClass": "btn-success"
      });

    })

    form.push({
      "type": "fieldset",
      "title": category,
      "expandable": false,
      "items": items
    })

  });

  permissionSchema.formid = {
    "type": "hidden"
  }

  form.push({
    "key": "formid"
  });

  form.push({
    "key": "formToken"
  });

  form.push({
    "title": "Submit",
    "type": "submit"
  });

  Object.keys(permissionSchema).forEach(function (item) {

    data.schema[item] = permissionSchema[item];

  })

  data.form = form;
  data.value = current;

  data.value["formid"] = "permissions";

  thisHook.finish(true, data);

})

iris.modules.admin_ui.registerHook("hook_form_submit_permissions", 0, function (thisHook, data) {

  fs.writeFileSync(iris.modules.auth.configPath + "/permissions.JSON", JSON.stringify(thisHook.const.params), "utf8");

  data = function (res) {

    res.send("/admin");

  }

  thisHook.finish(true, data);

});
