var path = require('path');

iris.modules.menu.globals.registerMenuLink("admin-toolbar", "/admin/structure", "/admin/structure/entities", "Entities", 1);


iris.app.get("/admin/structure/entities", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity_types"], ['admin_wrapper'], {
    entityTypes: Object.keys(iris.dbCollections)
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * API endpoint to access entity types.
 */
iris.app.get("/admin/api/entitytypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    res.send(Object.keys(iris.dbCollections));

  } else {

    res.redirect("/admin");

  }

});

/**
 * Page callback to create new entity type schema.
 */
iris.app.get("/admin/schema/create", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Render admin_schema template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema"], ['admin_wrapper'], {},
      req.authPass,
      req)
    .then(function (success) {

      res.send(success);

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

});

/**
 * Page callback to edit entity type schema.
 */
iris.app.get("/admin/schema/:type/edit", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Render admin_schema template.
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
 * Page callback to manage schema fields for a given entity type.
 */
iris.app.get("/admin/schema/:type/manage-fields", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Render admin_schema_manage_fields template.
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
 *Page callback to manage schema fieldsets for a given entity type.
 */
iris.app.get("/admin/schema/:type/fieldset/:fieldset", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Render admin_schema_manage_fields template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_manage_fields"], ['admin_wrapper'], {
    entityType: req.params.type,
    parent: req.params.fieldset
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Page callback to edit a field within a given fieldset of an entity.
 */
iris.app.get("/admin/schema/:type/fieldset/:fieldset/:field", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Render admin_schema_field template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_field"], ['admin_wrapper'], {
    entityType: req.params.type,
    field: req.params.field,
    parent: req.params.fieldset
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Page callback to edit specific root level field of an entity.
 */
iris.app.get("/admin/schema/:type/:field", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Render admin_schema_field template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_field"], ['admin_wrapper'], {
    entityType: req.params.type,
    field: req.params.field,
    parent: ''
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Page callback to delete field of an entity.
 */

iris.app.get("/admin/schema/:type/:field/delete", function (req, res) {


  // If not admin, present 403 page


  if (req.authPass.roles.indexOf('admin') === -1) {


    iris.modules.frontend.globals.displayErrorPage(403, req, res);


    return false;


  }


  // Render admin_schema_field template.

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_field_delete"], ['admin_wrapper'], {

    entityType: req.params.type,

    field: req.params.field,

  }, req.authPass, req).then(function (success) {


    res.send(success)


  }, function (fail) {


    iris.modules.frontend.globals.displayErrorPage(500, req, res);


    iris.log("error", fail);


  });

});


/**
 * Defines form schemaFieldDelete.
 * Allows the user to delete a field from the schema.
 */
+ iris.modules.entityUI.registerHook("hook_form_render_schemafieldDelete", 0, function (thisHook, data) {


  var entityType = thisHook.const.params[1];

  var fieldName = thisHook.const.params[2];

  var schema = iris.dbSchema[entityType];


  data.schema.message = {

    "type": "markup",

    "markup": "<h3>Are you sure you want to delete this field?"

  };

  data.schema.entityType = {

    "type": "hidden",

    "default": entityType

  };

  data.schema.fieldName = {

    "type": "hidden",

    "default": fieldName

  };


  data.value.entityType = entityType;

  data.value.fieldName = fieldName;


  data.form = [

"*",

    {

      "type": "submit",

      "title": "Delete"

},

    {

      "type": "button",

      "title": "Cancel",

      "onClick": function () {

        window.history.back();

      }

}
  ];

  thisHook.finish(true, data);
});


iris.modules.entityUI.registerHook("hook_form_submit_schemafieldDelete", 0, function (thisHook, data) {

  var entityType = thisHook.const.params.entityType;
  var fieldName = thisHook.const.params.fieldName;
  var schema = iris.dbSchemaConfig[entityType];
  var parent = '';

  if (schema && !schema[fieldName]) {


    var recurseFields = function (object, elementParent) {

      Object.keys(object).forEach(function (element) {

        if (element == fieldName) {

          parent = elementParent;

          delete object[element];

        } else if (typeof object[element].fieldType != 'undefined' && object[element].fieldType == 'Fieldset') {

          recurseFields(object[element].subfields, element);

        }

      });

    }

    recurseFields(schema.fields, '');


  } else if (schema && schema[fieldName]) {


    // Field is not nested.

    delete schema.fields[fieldName];
  }

  // Save and repopulate database schemas

  iris.saveConfig(schema, "entity", entityType, function (data) {


    iris.dbPopulate();


    thisHook.finish(true, function (res) {

      iris.message(thisHook.authPass.userid, "Field " + fieldName + " saved on entity " + entityType, "status");
      // If field belongs to a fieldset, redirect back to fieldset manage page.
      if (parent) {

        res.send({
          redirect: "/admin/schema/" + entityType + '/fieldset/' + parent
        });
      } else {

        res.send({
          redirect: "/admin/schema/" + entityType + '/manage-fields'

        });
      }

    });

  });

});



/**
 * Defines form schemaFieldListing.
 * Displays a table of existing fields for the given entity or fieldset.
 * There is also the option to add a new field here.
 */
iris.modules.entityUI.registerHook("hook_form_render_schemaFieldListing", 0, function (thisHook, data) {


  if (thisHook.const.params[1]) {

    var entityType = thisHook.const.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.finish(false, data);

      return false;

    }


    var entityTypeSchema = iris.dbSchemaConfig[entityType];
    // Parent is required to know which fields to list.
    var parent = thisHook.const.params[2];

    if (parent) {

      var recurseFields = function (object, elementParent) {

          for (element in object) {

            if (element == parent) {

              parentSchema = object[element];
              fields = object[element].subfields;

              return;

            } else if (typeof object[element].fieldType != 'undefined' && object[element].fieldType == 'Fieldset') {

              recurseFields(object[element].subfields, element);

            }

          };
        }
        // Do recursion to find the desired fields to list as they may be nested.
      recurseFields(entityTypeSchema.fields, parent);

    } else {
      parentSchema = entityTypeSchema.fields;
      fields = entityTypeSchema.fields;
    }

    var rows = [];
    var weightsList = [];

    // Loop over each field to add to the table.
    Object.keys(fields).forEach(function (fieldName) {

      var row = {};

      if (!parentSchema.subfields) {
        var field = JSON.parse(JSON.stringify(parentSchema[fieldName]));
      } else {
        var field = JSON.parse(JSON.stringify(parentSchema.subfields[fieldName]));
      }


      row['fieldLabel'] = field.label;
      row['fieldId'] = fieldName;
      row['fieldType'] = field.fieldType;
      row['fieldWeight'] = field.weight;
      row['fieldEdit'] = '<a href="/admin/schema/' + entityType + '/' + fieldName + '" >Edit</a>';
      row['fieldDelete'] = '<a href="/admin/schema/' + entityType + '/' + fieldName + '/delete" >Delete</a>';
      rows.push(row);

      // Currently a hacky way to alter the weights of fields, this creates a fidden field that gets updated
      // when the user re-orders the table.
      weightsList.push({
        "machineName": 'weight_' + fieldName,
        "weight": field.weight
      });
    });

    // Order the rows by weight.
    rows.sort(function (a, b) {

      if (a.fieldWeight > b.fieldWeight) {

        return 1;

      } else if (a.fieldWeight < b.fieldWeight) {

        return -1;

      } else {

        return 0;

      }

    });

    // Generate table markup. This should be replaced with a handlebars wrapper that generates a table from JSON.
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
      },
      parentItem: {
        "type": "hidden",
      }
    };

    data.form = [
      "table",
      "weightFields",
      "entityType",
      "parentItem",
      {
        "type": "fieldset",
        "title": "Add new field",
        "expandable": true,
        "items": [
          {
            "key": "label",
            "onKeyUp": function (evt, node) {
              var label = $("input[name=label]").val();
              label = label.replace(/[^a-zA-Z]+/g, "_").toLowerCase();
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
      }
    ];

    data.value.parentItem = parent;
    data.value.weightFields = weightsList;
    data.value.entityType = entityType;

    thisHook.finish(true, data);
  } else {
    thisHook.finish(false, data);
    iris.log("error", "No entityType field passed to hook_form_render_schemaFieldListing");
  }

});

/**
 * Submit handler for form schemaFieldListing.
 * Save the field weights if re-ordered and/or add a new field to this object in the schema.
 */
iris.modules.entityUI.registerHook("hook_form_submit_schemaFieldListing", 0, function (thisHook, data) {

  // Fetch current schema
  var schema = JSON.parse(JSON.stringify(iris.dbSchemaConfig[thisHook.const.params.entityType]));

  var fieldName = thisHook.const.params.fieldName;
  var entityType = thisHook.const.params.entityType;
  var parent = thisHook.const.params.parentItem;

  // Prepare schema

  var newSchema = {
    entityTypeName: entityType,
    fields: iris.dbSchemaConfig[entityType].fields
  }

  var recurseFields = function (object, elementParent) {

    Object.keys(object).forEach(function (element) {

      if (element == parent) {

        if (object[element].fieldType == 'Fieldset') {
          parentItem = object[element].subfields;
        } else {
          parentItem = object[element];
        }

        return;

      } else if (typeof object[element].fieldType != 'undefined' && object[element].fieldType == 'Fieldset') {

        recurseFields(object[element].subfields, element);

      }

    });
  }

  if (parent) {
    // Recursion required to find which field in the schema tree to update.
    recurseFields(schema.fields, parent);
  } else {
    parentItem = schema.fields;
  }

  // Update field weights.
  if (typeof thisHook.const.params.weightFields != 'undefined') {
    for (var i = 0; i < thisHook.const.params.weightFields.length; i++) {

      var fieldKey = thisHook.const.params.weightFields[i].machineName.replace('weight_', '');

      var schemaRef = parentItem[fieldKey];

      if (typeof schemaRef["weight"] != "undefined") {
        schemaRef["weight"] = thisHook.const.params.weightFields[i].weight;
      }

    };
  }

  // Prepare new field.
  if (thisHook.const.params.label != '' && thisHook.const.params.machineName != '') {

    if (parentItem.fieldType == 'Fieldset') {
      parentItem = parentItem.subfields;
    }
    parentItem[thisHook.const.params.machineName] = {
      "fieldType": thisHook.const.params.fieldType,
      "label": thisHook.const.params.label,
      "description": "",
      "permissions": [],
      "unique": false,
      "weight": "0"
    };

    if (parentItem[thisHook.const.params.machineName].fieldType == 'Fieldset') {
      parentItem[thisHook.const.params.machineName].subfields = {};
    }

  }

  // Save updated schema.
  iris.saveConfig(schema, "entity", entityType, function (data) {

    iris.dbPopulate();

    thisHook.finish(true, function (res) {

      iris.message(thisHook.authPass.userid, "Fields sucessfully saved", "status");
      var redirect = '/admin/schema/' + entityType;

      if (thisHook.const.params.machineName != '') {
        redirect += '/' + thisHook.const.params.machineName;
      } else {
        if (parent != '') {
          redirect += '/fieldset/' + parent;
        } else {
          redirect += '/manage-fields';
        }
      }
      res.send({
        redirect: redirect
      });

    });

  });

});

/**
 * Helper function to add basic field settings to each new field.
 * TODO: This should be a hook for others to latch onto.
 */
iris.modules.entityUI.globals.basicFieldForm = function (field, fieldName, entityType) {

  var data = {
    "value": {}
  };
  var entityTypeSchema = iris.dbSchemaConfig[entityType];

  data.value.fields = [];

  delete field.type;

  field.about = "<b>Machine name:</b> " + fieldName + "<br />";
  field.about += "<b>Field type:</b> " + field.fieldType;

  field.machineName = fieldName;

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

/**
 * Defines form schema.
 * This is used to add/edit entity types.
 * Only Title and Description are provided by default.
 */
iris.modules.entityUI.registerHook("hook_form_render_schema", 0, function (thisHook, data) {

  // Check entityType field is provided.
  if (thisHook.const.params[1]) {

    var entityType = thisHook.const.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, "No such entity type", "error");

      thisHook.finish(false, data);

      return false;

    }

  };

  var schema = iris.dbSchemaConfig[entityType];

  if (!schema) {
    schema = {};
  }
  if (entityType) {

    data.value.entityTypeName = entityType;

  }

  if (typeof schema["entityTypeDescription"] != 'undefined') {
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
      "default": schema['entityTypeDescription'] ? schema['entityTypeDescription'] : ''
    }
  }

  thisHook.finish(true, data);

});

/**
 * Submit handler for form schema.
 * Save the base entity details.
 */
iris.modules.entityUI.registerHook("hook_form_submit_schema", 0, function (thisHook, data) {


  var entityType = thisHook.const.params.entityTypeName;
  var finishedSchema = {
    fields: iris.dbSchemaConfig[entityType] && iris.dbSchemaConfig[entityType].fields ? iris.dbSchemaConfig[entityType].fields : {}
  };

  Object.keys(thisHook.const.params).forEach(function (field) {
    finishedSchema[field] = thisHook.const.params[field];
  });

  // Save schema.
  iris.saveConfig(finishedSchema, "entity", iris.sanitizeName(thisHook.const.params.entityTypeName), function (data) {

    iris.dbPopulate();

    data = function (res) {

      // Redirect to entity edit form or entity field settings form depending on how many fields are saved

      if (Object.keys(finishedSchema.fields).length == 0) {

        iris.message(thisHook.authPass.userid, "New entity type created", "status");
        res.json({
          redirect: "/admin/schema/" + iris.sanitizeName(thisHook.const.params.entityTypeName) + "/manage-fields"
        });


      } else {

        iris.message(thisHook.authPass.userid, "Entity type " + entityType + " has been updated.", "status");
        res.json({
          "redirect": "/admin/schema/" + iris.sanitizeName(thisHook.const.params.entityTypeName) + "/edit"
        });

      }

    }

    thisHook.finish(true, data);

  });

});


/**
 * Defines form schemaField.
 * This form includes the basic form settings as well as field-type specific settings.
 * This could be hooked into to add any further settings to the field.
 */

iris.modules.entityUI.registerHook("hook_form_render_schemafield", 0, function (thisHook, data) {

  data.form = [];
  var entityType = thisHook.const.params[1];
  var fieldName = thisHook.const.params[2];
  var parent = '';

  var field = {};

  // If this field is nested (within fieldset), perform recursion to find the element in the schema tree.
  if (iris.dbSchema[entityType] && !iris.dbSchema[entityType][fieldName]) {

    var recurseFields = function (object, elementParent) {

      Object.keys(object).forEach(function (element) {

        if (element == fieldName) {

          field = object[element];

          parent = elementParent;

        } else if (typeof object[element].fieldType != 'undefined' && object[element].fieldType == 'Fieldset') {

          recurseFields(object[element].subfields, element);

        }

      });
    }
    recurseFields(iris.dbSchemaConfig[entityType].fields, '');


  } else if (iris.dbSchema[entityType] && iris.dbSchema[entityType][fieldName]) {

    // Field is not nested.
    field = iris.dbSchema[entityType][fieldName];
  }


  // Ensure field has properties.
  if (Object.keys(field).length > 0) {

    // Add the saved Field type specific settings.
    if (field.settings) {

      data.value = {
        "settings": field.settings
      };

    }

    // Get the generic field settings to add to the form.
    var basicForm = iris.modules.entityUI.globals.basicFieldForm(field, fieldName, entityType);

    // Merge with the current data object.
    MergeRecursive(data, basicForm);

    // Set hidden values.
    data.schema.entityType = {
      "type": "hidden",
      "default": entityType
    }

    data.schema.fieldName = {
      "type": "hidden",
      "default": fieldName
    }
    data.schema.parent = {
      "type": "hidden",
      "default": parent
    }

    data.form.push("fields");
    data.form.push("entityType");
    data.form.push("fieldName");
    data.form.push("parent");

    data.value.entityType = entityType;
    data.value.fieldName = fieldName;
    data.value.parent = parent;

    // Add field type specific settings.
    iris.hook("hook_form_render_field_settings_" + field["fieldType"], thisHook.authPass, {
        entityType: entityType,
        fieldName: fieldName,
        schema: iris.dbSchema[entityType]
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

      iris.log("error", "No field type hook for: " + field["fieldType"]);
      thisHook.finish(true, data);

    })


  } else {

    iris.log("error", "No field properties found for field" + fieldName);
    thisHook.finish(false, data);

  }

});

/**
 * Submit handler for form schemaField.
 * Saves the field settings to the entity schema.
 */
iris.modules.entityUI.registerHook("hook_form_submit_schemafield", 0, function (thisHook, data) {

  // Fetch current schema as clone.
  var schema = JSON.parse(JSON.stringify(iris.dbSchemaConfig[thisHook.const.params.entityType]));
  var fieldName = thisHook.const.params.fieldName;
  var entityType = thisHook.const.params.entityType;
  var parent = thisHook.const.params.parent;

  delete thisHook.const.params.entityType;
  delete thisHook.const.params.fieldName;

  // savedElement becomes a reference to the field to be saved. This is particularly needed for when the
  // the field is nested somewhere within the schema tree.
  var savedElement = {};

  // Recursive function
  var recurseFields = function (object, elementParent) {

    // If the element doesn't exist, add it to the schema.
    if (parent == elementParent && !object[fieldName]) {

      treeArray.push(fieldName);

      // First element in tree.
      savedElement = schema.fields[treeArray[0]];

      // If nested, go down each level.
      for (var i = 1; i < treeArray.length; i++) {
        savedElement = savedElement.subfields[treeArray[i]];
      }
      return;
    }

    // Loop over each field.
    Object.keys(object).forEach(function (element) {

      // If a branch has been searched but doesn't contain the disired field, remove the element from the 
      // traversal array.
      if (treeArray.length > 0 && treeArray[treeArray.length - 1] != element && treeArray[treeArray.length - 1] != elementParent) {

        treeArray.pop();

      }

      // Found the diresed field.
      if (element == fieldName) {

        treeArray.push(element);

        // Add route field.
        savedElement = schema.fields[treeArray[0]];

        // If field is nested, traverse to the correct leaf.
        for (var i = 1; i < treeArray.length; i++) {
          savedElement = savedElement.subfields[treeArray[i]];
        }
        return;

      } else if (typeof object[element].fieldType != 'undefined' && object[element].fieldType == 'Fieldset') {

        // If a fieldset, drill into it.
        treeArray.push(element);
        recurseFields(object[element].subfields, element);

      }

    });
  }


  // Tree traversal record, add each node to the leaf in here.
  var treeArray = [];

  if (!schema.fields[fieldName]) {
    recurseFields(schema.fields, '');
  } else {
    savedElement = schema.fields[fieldName];
  }

  // Add the basic field settings to the schema.
  Object.keys(thisHook.const.params.fields).forEach(function (metaName) {

    if (!savedElement[metaName]) {

      savedElement[metaName] = {};

    }

    savedElement[metaName] = thisHook.const.params.fields[metaName];

  });

  if (savedElement.fieldType == 'Fieldset') {
    savedElement['subfields'] = {};
  }

  // Add field type specific settings.
  if (thisHook.const.params.settings) {
    savedElement.settings = thisHook.const.params.settings;
  }

  // Save and repopulate database schemas

  iris.saveConfig(schema, "entity", entityType, function (data) {

    iris.dbPopulate();

    thisHook.finish(true, function (res) {

      iris.message(thisHook.authPass.userid, "Field " + fieldName + " saved on entity " + entityType, "status");

      // If field belongs to a fieldset, redirect back to fieldset manage page.
      if (parent) {

        res.send({
          redirect: "/admin/schema/" + entityType + '/fieldset/' + parent
        });
      } else {

        res.send({
          redirect: "/admin/schema/" + entityType + '/manage-fields'
        });
      }

    });

  });

});

/**
 * Defines form_render_field_settings for Textfields.
 * Here set settings specific to Textfield input fields.
 */
iris.modules.entityUI.registerHook("hook_form_render_field_settings_Textfield", 0, function (thisHook, data) {

  // Set a maximum character length.
  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": {
      "title": {
        "type": "number",
        "title": "Maximum length",
        "default": "256"
      }
    }
  }

  thisHook.finish(true, data);

});

/**
 * Defines form_render_field_settings for Fieldsets.
 * Provide a link to manage the fields for this Fieldset.
 */
iris.modules.entityUI.registerHook("hook_form_render_field_settings_Fieldset", 0, function (thisHook, data) {

  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": {
      "linkToField": {
        "type": "markup",
        "markup": "<a href=\"/admin/schema/" + data.value.entityType + "/fieldset/" + data.value.fieldName + "\">Manage subfields</a>"
      }
    }
  }

  thisHook.finish(true, data);

});

/**
 * Defines form_render_field_settings for Select fields.
 * Provides multiple text fields to enter the select values.
 */
iris.modules.entityUI.registerHook("hook_form_render_field_settings_Select", 0, function (thisHook, data) {

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

/**
 * Register custom JSON form field for simple HTML.
 */
iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['markup'] = Object.create(JSONForm.elementTypes['text']);
  JSONForm.elementTypes['markup'].template = '<% if(value && !node.markup){node.markup = value} %><%= node.markup ? node.markup : node.schemaElement.markup  %>';
  JSONForm.elementTypes['markup'].fieldTemplate = true;
  JSONForm.elementTypes['markup'].inputfield = true;


}, "markup");


/**
 * Field Widgets object.
 * Field widgets are what renders the input field when creating an entity.
 */
iris.modules.entityUI.globals.fieldWidgets = {};

/**
 * Function for registering a widget.
 */
iris.modules.entityUI.globals.registerFieldWidget = function (fieldType, name, schema) {

  if (!iris.modules.entityUI.globals.fieldWidgets[fieldType]) {

    iris.modules.entityUI.globals.fieldWidgets[fieldType] = {};

  }

  iris.modules.entityUI.globals.fieldWidgets[fieldType][name] = schema;

};

/**
 * Defines form schemafieldwidgets.
 * Form for widget selection and settings.
 */
iris.modules.entityUI.registerHook("hook_form_render_schemafieldwidgets", 0, function (thisHook, data) {

  // Fetch current schema

  var entityType = thisHook.const.params[1];
  var fieldName = thisHook.const.params[2];

  var schema = JSON.parse(JSON.stringify(iris.dbSchemaConfig[entityType]));

  var fieldTypeName = schema.fields[fieldName].fieldType;



  if (iris.modules.entityUI.globals.fieldWidgets[fieldTypeName]) {

    var widgets = iris.modules.entityUI.globals.fieldWidgets[fieldTypeName];

  } else {

    // If no widgets are defined. Show help message.
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
      properties: widgets[widgetName] ? widgets[widgetName] : {
        empty: {
          "type": "markup",
          "markup": "This widget has no settings"
        }
      }
    };

  });

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

  if (schema.fields[fieldName].widget) {

    data.value = {};

    data.value.widgetChocie = schema.fields[fieldName].widget.name;

    data.value[schema.fields[fieldName].widget.name] = schema.fields[fieldName].widget.settings;

    data.value.entityType = entityType;
    data.value.fieldName = fieldName;

  }

  thisHook.finish(true, data);

});

/**
 * Submit handler for form schemafieldwidgets.
 * Save the chosen widget for a given field.
 */
iris.modules.entityUI.registerHook("hook_form_submit_schemafieldwidgets", 0, function (thisHook, data) {

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

  iris.saveConfig(newSchema, "entity", iris.sanitizeName(entityType), function (data) {

    iris.dbPopulate();

    data = function (res) {

      res.send({
        "redirect": "/admin/schema/" + iris.sanitizeName(entityType) + "/manage-fields"
      });

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
