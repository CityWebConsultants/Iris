var path = require('path');

iris.app.get("/admin/api/entitytypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    res.send(Object.keys(iris.dbCollections));

  } else {

    res.redirect("/admin");

  }

});

iris.modules.admin_ui.globals.prepareEntitylist = function (type, callback) {

  // Query for all entities of this type

  if (iris.dbCollections[type]) {

    var fields = [];

    iris.dbCollections[type].find({}, function (err, doc) {

      if (!err) {

        callback({
          entities: doc,
          fields: fields
        });

      } else {

        iris.log("error", "Database error while fetching entities");

        callback({});

      }

    })

  } else {

    iris.log("error", "Request for invalid entity type");

    callback({});

  }

}

// Entity Type forms


iris.app.get("/admin/schema/create", function (req, res) {

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

iris.app.get("/admin/schema/:type/:field", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_field"], ['admin_wrapper'], {
    entityType: req.params.type,
    field: req.params.field
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.modules.entity.registerHook("hook_form_render_schema", 0, function (thisHook, data) {

  // Is this a form for exisiting fields or an add a new field form?

  var existing = thisHook.const.params[2];

  if (thisHook.const.params[1]) {

    var entityType = thisHook.const.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.finish(false, data);

      return false;

    } else if (existing) {

      var entityTypeSchema = iris.dbSchemaConfig[entityType];

      data.value.fields = [];

      Object.keys(entityTypeSchema.fields).forEach(function (fieldName) {

        var field = JSON.parse(JSON.stringify(iris.dbSchema[entityType][fieldName]));

        delete field.type;

        field.about = "<br /><a class='btn btn-info' href='/admin/schema/" + entityType + "/" + fieldName + "'>Edit field settings</a><br />";

        field.about += "<br /><b>Machine name:</b> " + fieldName + "<br />";
        field.about += "<b>Field type:</b> " + iris.dbSchema[entityType][fieldName].fieldType;

        field.machineName = fieldName;

        field.weight = iris.dbSchema[entityType][fieldName].weight

        data.value.fields.push(field);

      })

      data.value.fields.sort(function (a, b) {

        if (a.weight > b.weight) {

          return 1;

        } else if (a.weight < b.weight) {

          return -1;

        } else {

          return 0;

        }

      })
    }

  };

  if (entityType) {

    data.value.entityTypeName = entityType;

  }

  data.schema = {
    "entityTypeName": {
      "type": entityType ? "hidden" : "text",
      "title": "Entity type name",
      "required": true,
      "default": entityType
    },
    "fields": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "about": {
            "type": "markup",
            "markup": ""
          },
          "fieldType": {
            "type": "text",
            "title": existing ? "" : "Field type",
            "description": existing ? "" : "This affects how this field is stored in the database and can't be changed easily later.",
            "enum": Object.keys(iris.fieldTypes).concat(["Fieldset"])
          },
          "machineName": {
            "type": existing ? "hidden" : "text",
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

// Register form for editing a field's deeper settings

iris.modules.entity.registerHook("hook_form_render_schemafield", 0, function (thisHook, data) {

  var entityType = thisHook.const.params[1];
  var fieldName = thisHook.const.params[2];

  if (iris.dbSchema[entityType] && iris.dbSchema[entityType][fieldName]) {

    var field = iris.dbSchema[entityType][fieldName];

    if (field.settings) {

      data.value = field.settings;

    }

    data.value.entityType = entityType;
    data.value.fieldName = fieldName;

    var fieldTypeForm = iris.fieldTypes[field["fieldType"]].form;

    data.schema = fieldTypeForm;

    data.schema.entityType = {
      "type": "hidden",
      "default": entityType
    }

    data.schema.fieldName = {
      "type": "hidden",
      "default": fieldName
    }

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, data);

  }

});

iris.modules.entity.registerHook("hook_form_submit_schemafield", 0, function (thisHook, data) {

  // Fetch current schema

  var schema = JSON.parse(JSON.stringify(iris.dbSchema[thisHook.const.params.entityType]));
  var fieldName = thisHook.const.params.fieldName;
  var entityType = thisHook.const.params.entityType;

  delete thisHook.const.params.entityType;
  delete thisHook.const.params.fieldName;

  // Prepare schema

  Object.keys(schema).forEach(function (fieldName) {

    delete schema[fieldName].type;

    var specialFields = ["entityType", "entityAuthor", "eid"];

    if (specialFields.indexOf(fieldName) !== -1) {

      delete schema[fieldName];

    }

  })

  // Add field's extra info

  schema[fieldName].settings = thisHook.const.params;

  // Generate new schema file by merging in old schema with new field settings

  var newSchema = {
    entityTypeName: entityType,
    fields: iris.dbSchemaConfig[entityType].fields
  }

  newSchema.fields[fieldName] = schema[fieldName];

  // Save and repopulate database schemas

  iris.saveConfig(newSchema, "entity", entityType, function (data) {

    iris.dbPopulate();

    thisHook.finish(true, function (res) {

      iris.message(thisHook.authPass.userid, "Field " + fieldName + " saved on entity " + entityType, "status");

      res.send({
        redirect: "/admin/schema/" + entityType
      });

    });

  });

})

// Register markup form field

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['markup'] = Object.create(JSONForm.elementTypes['text']);

  JSONForm.elementTypes['markup'].template = '<% if(value && !node.markup){node.markup = value} %><%= node.markup ? node.markup : node.schemaElement.markup  %>';
  JSONForm.elementTypes['markup'].fieldTemplate = true;
  JSONForm.elementTypes['markup'].inputfield = true;


}, "markup");

iris.modules.entity.registerHook("hook_form_submit_schema", 0, function (thisHook, data) {

  var entityType = thisHook.const.params.entityTypeName;
  var fields = thisHook.const.params.fields;

  // Check if only one field is being saved

  var singleField = (fields && fields.length === 1)

  if (singleField) {

    singleField = fields[0].machineName;

  }

  // Add weight fields

  if (fields) {

    fields.forEach(function (fieldName, index) {

      fields[index].weight = index;

    });

    // Initialise schema object

    var finishedSchema = {
      entityTypeName: entityType,
      fields: iris.dbSchemaConfig[entityType] && iris.dbSchemaConfig[entityType].fields ? iris.dbSchemaConfig[entityType].fields : {}
    };

    // Delete any fields that are in the original schema but not in the new one

    if (!singleField) {

      Object.keys(finishedSchema.fields).forEach(function (fieldName) {

        var present;

        fields.forEach(function (newField) {

          if (newField.machineName === fieldName) {

            present = true;

          }

        })

        if (!present) {

          delete finishedSchema.fields[fieldName];

        }

      });

    }

    // Add fields

    fields.forEach(function (field, index) {

      // Check if field doesn't exist

      finishedSchema.fields[field.machineName] = field;

      // Remove the machine name field. Not needed anymore.

      delete fields[index].machineName;

    })

  } else {

    finishedSchema = {
      "entityTypeName": entityType,
      "fields": {}
    }

  }

  iris.saveConfig(finishedSchema, "entity", iris.sanitizeFileName(thisHook.const.params.entityTypeName), function (data) {

    iris.dbPopulate();

    data = function (res) {

      // Redirect to entity edit form or entity field settings form depending on how many fields are saved

      if (singleField) {

        res.send("/admin/schema/" + iris.sanitizeFileName(thisHook.const.params.entityTypeName) + "/" + singleField);

      } else {

        res.send("/admin/schema/" + iris.sanitizeFileName(thisHook.const.params.entityTypeName));

      }

    }

    thisHook.finish(true, data);

  })

})

// Form for widget selection and settings

iris.modules.entity.registerHook("hook_form_render_schemafieldwidgets", 0, function (thisHook, data) {

  // Fetch current schema

  var entityType = thisHook.const.params[1];
  var fieldName = thisHook.const.params[2];

  var schema = JSON.parse(JSON.stringify(iris.dbSchema[entityType]));

  var fieldTypeName = schema[fieldName].fieldType;

  var fieldTypeSettings = JSON.parse(JSON.stringify(iris.fieldTypes[fieldTypeName]));

  if (fieldTypeSettings.widgets) {

    var widgets = fieldTypeSettings.widgets;

  } else {

    thisHook.finish(false, "No widgets defined");
    return false;

  }

  // Add widgets to form

  data.schema = widgets;

  data.schema.widgetChoice = {
    "type": "string",
    "title": "Make a choice",
    "enum": Object.keys(widgets)
  }

  data.schema.entityType = {
    "type": "hidden",
    "default": entityType
  }

  data.schema.fieldName = {
    "type": "hidden",
    "default": fieldName
  }

  data.form = [{
    type: "help",
    helpvalue: "<h2>Widgets</h2><p>Pick a widget to use to display this field to the user on entity forms</p>"
  }, {
    "type": "selectfieldset",
    "title": "Make a choice",
    "key": "widgetChoice",
    "items": []
    }];

  Object.keys(widgets).forEach(function (widgetName) {

    data.form[1].items.push({
      key: widgetName,
      "legend": widgetName
    })

  })

  data.form.push({
    key: "entityType",
  })

  data.form.push({
    key: "fieldName",
  })

  data.form.push({
    type: "submit",
    value: "Save widget settings"
  })

  // Check if widgets already set and prepopulate form if so

  if (schema[fieldName].widget) {

    data.value = {};

    data.value.widgetChocie = schema[fieldName].widget.name;

    data.value[schema[fieldName].widget.name] = schema[fieldName].widget.settings;

    data.value.entityType = entityType;
    data.value.fieldName = fieldName;

  }

  thisHook.finish(true, data);

})

iris.modules.entity.registerHook("hook_form_submit_schemafieldwidgets", 0, function (thisHook, data) {

  var entityType = thisHook.const.params.entityType;
  var fieldName = thisHook.const.params.fieldName

  // Get current schema

  var schema = iris.dbSchema[entityType];

  // Slot in widget settings

  var widgetChoice = thisHook.const.params.widgetChoice;

  // Prepare schema object for saving

  var newSchema = {
    entityTypeName: entityType,
    fields: iris.dbSchemaConfig[entityType].fields
  };

  iris.dbSchemaConfig[entityType].fields[fieldName].widget = {
    name: widgetChoice,
    settings: thisHook.const.params[widgetChoice]
  };

  iris.saveConfig(newSchema, "entity", iris.sanitizeFileName(entityType), function (data) {

    iris.dbPopulate();

    data = function (res) {

      res.send("/admin/schema/" + iris.sanitizeFileName(entityType));

    }

    thisHook.finish(true, data);

  })

});
