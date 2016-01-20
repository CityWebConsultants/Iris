iris.app.get("/admin/schema", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.app.get("/admin/schema/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema"], ['admin_wrapper'], {
    entityType: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.modules.entity.registerHook("hook_form_render_schema", 0, function (thisHook, data) {

  if (thisHook.const.params[1]) {

    var entityType = thisHook.const.params[1];

    if (!iris.dbSchema[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.finish(false, data);

      return false;

    } else {

      var entityTypeSchema = iris.dbSchema[entityType];

      data.value.fields = [];

      var specialFields = ["entityType", "entityAuthor", "eid"];

      Object.keys(entityTypeSchema).forEach(function (field) {

        if (specialFields.indexOf(field) !== -1) {

          return false;

        }

        var field = JSON.parse(JSON.stringify(iris.dbSchema[entityType][field]));

        delete field.type;

        data.value.fields.push(field);

      })


    }

  };

  data.schema = {
    "title": {
      "type": entityType ? "hidden" : "text",
      "title": "Entity type name"
    },
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "fieldType": {
            "type": "text",
            "title": "Field type",
            "description": "This affects how this field is stored in the database.",
            "enum": Object.keys(iris.fieldTypes)
          },
          "machineName": {
            "type": "text",
            "title": "Database name",
            "description": "What this field will be called in the database. Lowercase letters and underscores only."
          },
          "label": {
            "type": "text",
            "title": "Field label"
          },
          "description": {
            "type": "textarea",
            "title": "Field description"
          },
          "permissions": {
            "type": "checkboxbuttons",
            "activeClass": "btn-success",
            "title": "Field view permissions",
            "items": {
              "enum": Object.keys(iris.modules.auth.globals.roles)
            }
          }
        }
      }
    }
  }

  thisHook.finish(true, data);

})

iris.modules.entity.registerHook("hook_form_submit_schema", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.const.params, "entity", iris.sanitizeFileName(thisHook.const.params.title), function (data) {

    console.log("saved");

  })

  iris.dbPopulate();

  data = function (res) {

    res.send({
      "redirect": "/admin/schema/" + iris.sanitizeFileName(thisHook.const.params.title)
    })

  }

  thisHook.finish(true, data);

})
