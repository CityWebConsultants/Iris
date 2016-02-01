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

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema"], ['admin_wrapper'], {},
      req.authPass,
      req)
    .then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

});

iris.app.get("/admin/schema/:type/edit", function (req, res) {

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


/**
 * Manage schema fields.
 */
iris.app.get("/admin/schema/:type/manage-fields", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_manage_fields"], ['admin_wrapper'], {
    entityType: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Edit specific field.
 */
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

iris.modules.entity.registerHook("hook_form_render_schemaFieldListing", 0, function (thisHook, data) {

  var existing = thisHook.const.params[2];

  if (thisHook.const.params[1]) {

    var entityType = thisHook.const.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.finish(false, data);

      return false;

    } else if (existing) {

      var entityTypeSchema = iris.dbSchemaConfig[entityType];

      var rows = [];
      var weightsList = [];
      Object.keys(entityTypeSchema.fields).forEach(function (fieldName) {
        var row = {};

        var field = JSON.parse(JSON.stringify(iris.dbSchema[entityType][fieldName]));

        row['fieldLabel'] = field.label;
        row['fieldId'] = fieldName;
        row['fieldType'] = field.fieldType;
        row['fieldWeight'] = field.weight;
        row['fieldEdit'] = '<a href="/admin/schema/' + entityType + '/' + fieldName + '" >Edit</a>';
        row['fieldDelete'] = '<a href="/admin/schema/' + entityType + '/' + fieldName + '/delete" >Delete</a>';
        rows.push(row);

        weightsList.push({
          "machineName": 'weight_' + fieldName,
          "weight": field.weight
        });
      });

      rows.sort(function (a, b) {

        if (a.fieldWeight > b.fieldWeight) {

          return 1;

        } else if (a.fieldWeight < b.fieldWeight) {

          return -1;

        } else {

          return 0;

        }

      });

      var tableHtml = '<table>' +
        '<thead>' +
        '<th></th>' +
        '<th>Label</th>' +
        '<th>Machine name</th>' +
        '<th>Type</th>' +
        '<th>Edit</th>' +
        '<th>Delete</th>' +
        '</thead>' +
        '<tbody class="ui-sortable">';
      var counter = 0;
      rows.forEach(function (tableRow) {

        tableHtml += '<tr>';
        tableHtml += '<td><span class="glyphicon glyphicon-resize-vertical"></span></td>';
        for (tableCell in tableRow) {
          tableHtml += "<td class=\"" + tableCell + "\">" + tableRow[tableCell] + "</td>";
        };

        tableHtml += '</tr>';

      });
      tableHtml += '</tbody></table>';

    }

    var weightFields = {
      "type": "array",
      "title": "weights",
      "items": {
        "type": "object",
        "properties": {
          "weight": {
            "type": "number",
          },
          "machineName": {
            "type": "hidden"
          }
        }
      }
    }

    data.value.weightFields = weightsList;
    data.value.entityType = entityType;
    data.schema = {
      "table": {
        "type": "markup",
        "markup": tableHtml
      },
      weightFields,
      "label": {
        "type": "text",
        "title": "Field label"
      },
      "machineName": {
        "type": "text",
        "title": "Database name",
      },
      "fieldType": {
        "type": "text",
        "title": "Field type",
        "enum": Object.keys(iris.fieldTypes).concat(["Fieldset"])
      },
      "entityType": {
        "type": "hidden",
      }
    };

    data.form = [
      "table",
      "weightFields",
      "entityType",
      {
        "type": "fieldset",
        "title": "Add new field",
        "expandable": true,
        "items": [
          {
            "key": "label",
            "onKeyUp": function (evt, node) {
              var label = $("input[name=label]").val();
              label = label.replace(/[^a-zA-Z]+/g, "_");
              $('#machineNameBuilder').html("field_" + label);
              $("input[name=machineName]").val("field_" + label);
            }
        },
          {
            "key": "machineName",
            "onInsert": function (evt, node) {
              $("input[name=machineName]").before("<div id=\"machineNameBuilder\"></div>");
            }
      },
        "fieldType"
      ]
    },
      {
        "type": "submit",
        "title": "Save"
    }];

    thisHook.finish(true, data);
  }


  thisHook.finish(false, data);

});

iris.modules.entity.registerHook("hook_form_submit_schemaFieldListing", 0, function (thisHook, data) {

  // Fetch current schema
  var schema = JSON.parse(JSON.stringify(iris.dbSchema[thisHook.const.params.entityType]));

  var fieldName = thisHook.const.params.fieldName;
  var entityType = thisHook.const.params.entityType;

  delete thisHook.const.params.entityType;
  delete thisHook.const.params.fieldName;

  // Prepare schema

  var newSchema = {
    entityTypeName: entityType,
    fields: iris.dbSchemaConfig[entityType].fields
  }

  if (typeof thisHook.const.params.weightFields != 'undefined') {
    for (var i = 0; i < thisHook.const.params.weightFields.length; i++) {

      var fieldKey = thisHook.const.params.weightFields[i].machineName.replace('weight_', '');
      if (typeof schema[fieldKey]["weight"] != "undefined") {
        schema[fieldKey]["weight"] = thisHook.const.params.weightFields[i].weight;
        newSchema.fields[fieldKey] = schema[fieldKey];
      }

    };
  }

  // Prepare new field.
  if (thisHook.const.params.label != '' && thisHook.const.params.machineName != '') {
    newSchema.fields[thisHook.const.params.machineName] = {
      "fieldType": thisHook.const.params.fieldType,
      "label": thisHook.const.params.label,
      "description": "",
      "permissions": [],
      "unique": false,
      "weight": "0"
    }
  }


  iris.saveConfig(newSchema, "entity", entityType, function (data) {

    iris.dbPopulate();

    thisHook.finish(true, function (res) {

      if (thisHook.const.params.label == '') {
        iris.message(thisHook.authPass.userid, "Fields sucessfully re-arranged", "status");

        res.send({
          redirect: "/admin/schema/" + entityType + "/" + "manage-fields"
        });
      } else {
        res.send({
          redirect: "/admin/schema/" + entityType + "/" + thisHook.const.params.machineName + "/" + "manage-fields"
        });
      }

    });

  });

});

iris.modules.entity.globals.basicFieldForm = function (fieldName, entityType) {

  var data = {
    "value": {}
  };
  var entityTypeSchema = iris.dbSchemaConfig[entityType];

  data.value.fields = [];

  var field = JSON.parse(JSON.stringify(iris.dbSchema[entityType][fieldName]));

  delete field.type;

  field.about = "<b>Machine name:</b> " + fieldName + "<br />";
  field.about += "<b>Field type:</b> " + iris.dbSchema[entityType][fieldName].fieldType;

  field.machineName = fieldName;

  field.weight = iris.dbSchema[entityType][fieldName].weight

  field.unique = iris.dbSchema[entityType][fieldName].unique

  data.value.fields = field;


  if (entityType) {

    data.value.entityTypeName = entityType;

  }

  data.schema = {
    "entityTypeName": {
      "type": "hidden",
      "title": "Entity type name",
      "required": true,
      "default": entityType
    },
    "fields": {
      "title": "Basic settings",
      "type": "object",
      "properties": {
        "about": {
          "type": "markup",
          "markup": ""
        },
        "machineName": {
          "type": "hidden",
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
        },
        "unique": {
          "type": "boolean",
          "title": "Unique field",
          "description": "Should this field be unique for each entity? This option will make it impossible to have two fields of the same value in this entity type."
        }
      }

    }
  }

  return data;
}

iris.modules.entity.registerHook("hook_form_render_schema", 0, function (thisHook, data) {


  if (thisHook.const.params[1]) {

    var entityType = thisHook.const.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.finish(false, data);

      return false;

    }

  };

  var schema = iris.dbSchemaConfig[entityType];

  if (entityType) {

    data.value.entityTypeName = entityType;

  }

  if (typeof schema["entityTypeDescription"] != "undefined") {
    data.value.entityTypeDescription = schema["entityTypeDescription"];
  }

  data.schema = {
    "entityTypeName": {
      "type": "text",
      "title": "Entity type name",
      "required": true,
      "default": entityType
    },
    "entityTypeDescription": {
      "type": "text",
      "title": "Description",
      "default": schema["entityTypeDescription"] ? schema["entityTypeDescription"] : ''
    }
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_form_submit_schema", 0, function (thisHook, data) {


  var entityType = thisHook.const.params.entityTypeName;
  var finishedSchema = {
    fields: iris.dbSchemaConfig[entityType] && iris.dbSchemaConfig[entityType].fields ? iris.dbSchemaConfig[entityType].fields : {}
  };

  Object.keys(thisHook.const.params).forEach(function (field) {
    finishedSchema[field] = thisHook.const.params[field];
  });

  iris.saveConfig(finishedSchema, "entity", iris.sanitizeFileName(thisHook.const.params.entityTypeName), function (data) {

    iris.dbPopulate();

    data = function (res) {

      // Redirect to entity edit form or entity field settings form depending on how many fields are saved

      if (Object.keys(finishedSchema.fields).length == 0) {

        iris.message(thisHook.authPass.userid, "New entity type created", "status");
        res.send("/admin/schema/" + iris.sanitizeFileName(thisHook.const.params.entityTypeName) + "/manage-fields");

      } else {

        iris.message(thisHook.authPass.userid, "Entity type " + entityType + " has been updated.", "status");
        res.send("/admin/schema/" + iris.sanitizeFileName(thisHook.const.params.entityTypeName) + "/edit");

      }

    }

    thisHook.finish(true, data);

  });

});


// Register form for editing a field's deeper settings

iris.modules.entity.registerHook("hook_form_render_schemafield", 0, function (thisHook, data) {

  data.form = [];
  var entityType = thisHook.const.params[1];
  var fieldName = thisHook.const.params[2];

  if (iris.dbSchema[entityType] && iris.dbSchema[entityType][fieldName]) {


    var field = iris.dbSchema[entityType][fieldName];

    if (field.settings) {

      data.value = {
        "settings": field.settings
      };

    }

    var basicForm = iris.modules.entity.globals.basicFieldForm(fieldName, entityType);

    MergeRecursive(data, basicForm);

    data.value.entityType = entityType;
    data.value.fieldName = fieldName;

    // Get field type form from the form system

    data.schema.entityType = {
      "type": "hidden",
      "default": entityType
    }

    data.schema.fieldName = {
      "type": "hidden",
      "default": fieldName
    }

    data.form.push("fields");

    data.form.push("entityType");
    data.form.push("fieldName");

    iris.hook("hook_form_render_field_settings_" + field["fieldType"], thisHook.authPass, {
        entityType: entityType,
        fieldName: fieldName
      },
      data
    ).then(function (form) {

      form.form.push("settings");

      form.form.push({
        "type": "submit",
        "title": "Save field"
      });
      thisHook.finish(true, form);

    }, function (fail) {

      data.form.push({
        "type": "submit",
        "title": "Save field"
      });
      iris.log("No field type hook for: " + field["fieldType"], fail);
      thisHook.finish(true, data);

    })


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

  Object.keys(thisHook.const.params.fields).forEach(function (metaName) {

    if (!schema[fieldName][metaName]) {

      schema[fieldName][metaName] = {};

    }

    schema[fieldName][metaName] = thisHook.const.params.fields[metaName];

  });

  // Add field's extra info
  schema[fieldName].settings = thisHook.const.params.settings;

  // Generate new schema file by merging in old schema with new field settings

  //TODO: Why is a new schema needed?
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
        redirect: "/admin/schema/" + entityType + '/manage-fields'
      });

    });

  });

});

iris.modules.entity.registerHook("hook_form_render_field_settings_Textfield", 0, function (thisHook, data) {

  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": {
      "title": {
        "type": "text",
        "title": "Maximum length"
      }
    }
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_form_render_field_settings_Select", 0, function (thisHook, data) {

  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": {
      "options": {
        "type": "array",
        "title": "List of options",
        "items": {
          "type": "text"
        }
      }
    }
  }

  thisHook.finish(true, data);

});

// Register markup form field

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['markup'] = Object.create(JSONForm.elementTypes['text']);

  JSONForm.elementTypes['markup'].template = '<% if(value && !node.markup){node.markup = value} %><%= node.markup ? node.markup : node.schemaElement.markup  %>';
  JSONForm.elementTypes['markup'].fieldTemplate = true;
  JSONForm.elementTypes['markup'].inputfield = true;


}, "markup");


// Function for registering a widget

iris.modules.entity.globals.fieldWidgets = {};

iris.modules.entity.globals.registerFieldWidget = function (fieldType, name, schema) {

  if (!iris.modules.entity.globals.fieldWidgets[fieldType]) {

    iris.modules.entity.globals.fieldWidgets[fieldType] = {};

  }

  iris.modules.entity.globals.fieldWidgets[fieldType][name] = schema;

};

// Test

//iris.modules.entity.globals.registerFieldWidget("Textfield", "Look at me!", {
//  "hello": {
//    "type": "text",
//    "title": "Hi!"
//  }
//});

// Form for widget selection and settings

iris.modules.entity.registerHook("hook_form_render_schemafieldwidgets", 0, function (thisHook, data) {

  // Fetch current schema

  var entityType = thisHook.const.params[1];
  var fieldName = thisHook.const.params[2];


  var schema = JSON.parse(JSON.stringify(iris.dbSchema[entityType]));

  var fieldTypeName = schema[fieldName].fieldType;

  if (iris.modules.entity.globals.fieldWidgets[fieldTypeName]) {

    var widgets = iris.modules.entity.globals.fieldWidgets[fieldTypeName];

  } else {

    data.form = [
     "*",
      {
        "type": "help",
        "helpvalue": "No widgets available for this field"
        }
    ];
    iris.log("error", "No widget defined for field: " + fieldTypeName);
    thisHook.finish(true, data);
    return false;

  }

  // Add widgets to form

  Object.keys(widgets).forEach(function (widgetName) {

    data.schema[widgetName] = {
      type: "object",
      properties: widgets[widgetName]
    }

  })

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

/*
 * Recursively merge properties of two objects.
 * Used because $.extend is not available. Could be made global.
 */
function MergeRecursive(obj1, obj2) {

  for (var p in obj2) {
    try {
      // Property in destination object set; update its value.
      if (obj2[p].constructor == Object) {
        obj1[p] = MergeRecursive(obj1[p], obj2[p]);

      } else {
        obj1[p] = obj2[p];

      }

    } catch (e) {
      // Property in destination object not set; create it and set its value.
      obj1[p] = obj2[p];

    }
  }

  return obj1;
}
