iris.app.get("/admin/schema", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_create"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.modules.entity.registerHook("hook_form_render_schema", 0, function (thisHook, data) {

  data.schema = {
    "title": {
      "type": "text",
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
          "label": {
            "type": "text",
            "title": "Field label"
          },
          "description": {
            "type": "textarea",
            "title": "Field description"
          },
          "description": {
            "type": "textarea",
            "title": "Field description"
          }
        }
      }
    }
  }

  thisHook.finish(true, data);

})
