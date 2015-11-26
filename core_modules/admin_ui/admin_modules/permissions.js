var fs = require('fs');

// Permissions form

CM.admin_ui.registerHook("hook_form_render_permissions", 0, function (thisHook, data) {

  // Check if menu name supplied and previous values available

  var current = {};

  try {
    var currentPermissions = fs.readFileSync(CM.auth.configPath + "/permissions.JSON", "utf8");

    current = JSON.parse(currentPermissions);

  } catch (e) {

    fs.writeFileSync(CM.auth.configPath + "/permissions.JSON", JSON.stringify({}), "utf8");

  }

  var permissions = CM.auth.globals.permissions;

  var roles = CM.auth.globals.roles;

  var permissionSchema = {};
  var form = [];

  // Loop over each permission and add a schema item for it.

  // Categories first, later move these into fieldsets

  Object.keys(CM.auth.globals.permissions).forEach(function (category) {

    var items = [];

    Object.keys(CM.auth.globals.permissions[category]).forEach(function (permissionName) {

      var permission = CM.auth.globals.permissions[category][permissionName].name;

      permissionSchema[permission] = {
        "type": "array",
        "title": permission.toUpperCase(),
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

  permissionSchema.form2id = {
    "type": "hidden"
  }

  form.push({
    "key": "formid"
  });

  form.push({
    "title": "Submit",
    "type": "submit"
  });

  data.schema = permissionSchema;
  data.form = form;
  data.value = current;

  data.value["formid"] = "permissions";

  thisHook.finish(true, data);

})

CM.admin_ui.registerHook("hook_form_submit_permissions", 0, function (thisHook, data) {

  fs.writeFileSync(CM.auth.configPath + "/permissions.JSON", JSON.stringify(thisHook.const.params), "utf8");

  data = function (res) {

    res.send("/admin");

  }

  thisHook.finish(true, data);

});
