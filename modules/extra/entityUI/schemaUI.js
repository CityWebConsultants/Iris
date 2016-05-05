var path = require('path');

var routes = {
  field: {
    title: "Basic settings",
    description: "",
    permissions: ["can access admin pages"],
    tab: {
      parent: "/admin/schema/:type/fields",
      title: "Basic settings"
    }
  },
  fieldsetField: {
    title: "Basic settings",
    description: "",
    permissions: ["can access admin pages"],
    tab: {
      parent: "/admin/schema/:type/fieldset/:field",
      title: "Basic settings",
    }
  },
  widget: {
    title: "Field widget",
    description: "",
    permissions: ["can access admin pages"],
    tab: {
      parent: "/admin/schema/:type/fields",
      title: "Widget",
    }
  },
  fieldsetWidget: {
    title: "Fieldset widget",
    description: "",
    permissions: ["can access admin pages"],
    tab: {
      parent: "/admin/schema/:type/fieldset/:field",
      title: "Widget",
    }
  },
  entities: {
    title: "Entities",
    description: "A list of all entity types",
    permissions: ["can access admin pages"],
    "menu": [{
      menuName: "admin_toolbar",
      parent: "/admin/structure",
      title: "Entities"
    }]
  },
  createType: {
    title: "Create entity type",
    description: "",
    permissions: ["can access admin pages"],
  },
  editType: {
    title: "Edit entity type",
    description: "Edit existing entity type",
    permissions: ["can access admin pages"],
  },
  deleteType: {
    title: "Delete entity type",
    description: "Delete schema and content",
    permissions: ["can access admin pages"],
  },
  fields: {
    title: "Manage entity fields",
    description: "Add and update entity fields",
    permissions: ["can access admin pages"],
  },
  fieldset: {
    title: "Manage entity fieldset",
    description: "Manage entity fieldset",
    permissions: ["can access admin pages"],
  },
  fieldDelete: {
    title: "Delete field",
    description: "Remove the field from the entity type",
    permissions: ["can access admin pages"],
  },
  apiTypes: {
    title: "Entities",
    permissions: ["can access admin pages"]
  }
};

iris.route.get("/admin/structure/entities", routes.entities, function (req, res) {

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
iris.route.get("/admin/api/entitytypes", routes.apiTypes, function (req, res) {

    res.send(Object.keys(iris.dbCollections));

});

/**
 * Page callback to create new entity type schema.
 */
iris.route.get("/admin/schema/create", routes.createType, function (req, res) {

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
iris.route.get("/admin/schema/:type/edit", routes.editType, function (req, res) {


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


iris.route.get("/admin/schema/:type/delete", routes.deleteType, function(req, res){

  // Render admin_schema template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_delete"], ['admin_wrapper'], {
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
iris.route.get("/admin/schema/:type/fields", routes.fields, function (req, res) {

  req.irisRoute.options.title = req.authPass.t('Manage {{type}} fields', {type: req.params.type});

  // Render admin_schema_manage_fields template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_manage_fields"], ['admin_wrapper'], {
    entityType: req.params.type,
    bodyClass: 'schema-admin'
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
iris.route.get("/admin/schema/:type/fieldset/:fieldset", routes.fieldset, function (req, res) {

  req.irisRoute.options.title = req.authPass.t('Manage fieldset {{fieldset}} : {{type}}', {type: req.params.type, fieldset: req.params.fieldset});

  // Render admin_schema_manage_fields template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_manage_fields"], ['admin_wrapper'], {
    entityType: req.params.type,
    parent: req.params.fieldset,
    bodyClass: 'schema-admin'
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
iris.route.get("/admin/schema/:type/fieldset/:fieldset/:field", routes.fieldsetField, function (req, res) {

  iris.modules.entityUI.globals.fieldForm(req.params.type, req.params.field, req.params.fieldset, req, res);

});

/**
 * Page callback to edit specific root level field of an entity.
 */
iris.route.get("/admin/schema/:type/fields/:field", routes.field, function (req, res) {

  req.irisRoute.options.title = req.authPass.t('Edit field {{field}} : {{type}}', {field: req.params.field, type: req.params.type});

  iris.modules.entityUI.globals.fieldForm(req.params.type, req.params.field, '', req, res);

});

/**
 * Root fields and fieldset fields use the same code.
 * @param type
 * @param field
 * @param parent
 */
iris.modules.entityUI.globals.fieldForm = function(type, field, parent, req, res) {

  // Render admin_schema_field template.
  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_field"], ['admin_wrapper'], {
    entityType: type,
    field: field,
    parent: parent,
    bodyClass: 'schema-admin'
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

}

/**
 * Page callback to edit specific root level field of an entity.
 */
iris.route.get("/admin/schema/:type/fields/:field/widget", routes.widget, function (req, res) {

  req.irisRoute.options.title = req.authPass.t('Edit field widget for {{field}} : {{type}}', {field: req.params.field, type: req.params.type});

  iris.modules.entityUI.globals.widgetForm(req.params.type, req.params.field, '', req, res)

});

/**
 * Page callback to edit specific widgets of fieldset fields.
 */
iris.route.get("/admin/schema/:type/fieldset/:fieldset/:field/widget", routes.fieldsetWidget, function (req, res) {

  req.irisRoute.options.title = req.authPass.t('Edit field widget for {{field}} : {{type}}', {field: req.params.field, type: req.params.type});

  iris.modules.entityUI.globals.widgetForm(req.params.type, req.params.field, req.params.fieldset, req, res)

});

iris.modules.entityUI.globals.widgetForm = function(type, field, parent, req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_schema_field_widget"], ['admin_wrapper'], {
    entityType: type,
    field: field,
    parent: parent,
    bodyClass: 'schema-admin no-legend'
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

}

/**
 * Page callback to delete field of an entity.
 */

iris.route.get("/admin/schema/:type/fields/:field/delete", routes.fieldDelete, function (req, res) {

  // Render admin_schema_field template.
  req.irisRoute.options.title = req.authPass.t('Delete field {{field}} on entity type {{type}}', {field: req.params.field, type: req.params.type});

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

iris.modules.entityUI.registerHook("hook_form_render__schemaDelete", 0, function (thisHook, data) {
  var entityType = thisHook.context.params[1];

  data.schema = {
    "schema": {
      "key": "schema"
    }
  };

  data.form = [
    {
      "type": "help",
      "helpvalue": "<div class='alert alert-danger'>Are you sure you want to delete this entity? This will also delete all it's data in the database.</div>",
    },
    {
    "type": "button",
    "id": "yes",
    "value": "delete",
    "title": "Delete Scheme " + entityType,
      "htmlClass": "btn-danger"
    },
    {
      "type": "hidden",
      "id": "schema",
      "value": entityType,
      "key": "schema"
    }
  ];

  thisHook.pass(data);

});

iris.modules.entityUI.registerHook("hook_form_submit__schemaDelete", 0, function (thisHook, data) {
  var schema = thisHook.context.params.schema;
  iris.invokeHook("hook_schema_delete", thisHook.authPass, null, thisHook.context.params)
  .then(function(data){
    data.callback = "/admin/structure/entities";
    data.message = [{
      'type' : 'success',
      'message' : 'Successfully deleted schema "' + schema + '".'
    }];

    thisHook.pass(data);

  }, function(err){
    thisHook.fail(err);
  });
});

/**
 * Defines form schemaFieldDelete.
 * Allows the user to delete a field from the schema.
 */
iris.modules.entityUI.registerHook("hook_form_render__schemafieldDelete", 0, function (thisHook, data) {


  var entityType = thisHook.context.params[1];

  var fieldName = thisHook.context.params[2];

  var schema = iris.dbSchema[entityType];


  data.schema.message = {
    "type": "markup",
    "markup": "<h3>" + thisHook.authPass.t("Are you sure you want to delete this field?") + "</h3>"
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

      "title": thisHook.authPass.t("Delete")

},

    {

      "type": "button",

      "title": thisHook.authPass.t("Cancel"),

      "onClick": function () {

        window.history.back();

      }

}
  ];

  thisHook.pass(data);
});


iris.modules.entityUI.registerHook("hook_form_submit__schemafieldDelete", 0, function (thisHook, data) {

  var entityType = thisHook.context.params.entityType;
  var fieldName = thisHook.context.params.fieldName;
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


    thisHook.pass(function (res) {

      iris.message(thisHook.authPass.userid, thisHook.authPass.t("Field {{name}} saved on entity {{type}}", {name: fieldName, type: entityType}), "success");
      // If field belongs to a fieldset, redirect back to fieldset manage page.
      if (parent) {

        res.send({
          redirect: "/admin/schema/" + entityType + '/fieldset/' + parent
        });
      } else {

        res.send({
          redirect: "/admin/schema/" + entityType + '/fields'

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
iris.modules.entityUI.registerHook("hook_form_render__schemaFieldListing", 0, function (thisHook, data) {


  var ap = thisHook.authPass;
  if (thisHook.context.params[1]) {

    var entityType = thisHook.context.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, ap.t("No such entity type"), "danger");

      thisHook.fail(data);

      return false;

    }


    var entityTypeSchema = iris.dbSchemaConfig[entityType];
    // Parent is required to know which fields to list.
    var parent = thisHook.context.params[2];

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
      row['fieldOptions'] = '<a class="btn btn-default" href="/admin/schema/' + entityType + '/fields/' + fieldName + '" >' + ap.t('Edit') + '</a>' +
                            '&nbsp;<a class="btn btn-danger" href="/admin/schema/' + entityType + '/fields/' + fieldName + '/delete" >' + ap.t('Delete') + '</a>';
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
      '<tr class="admin-header">' +
      '<th></th>' +
      '<th>' + ap.t('Label') + '</th>' +
      '<th>' + ap.t('Machine name') + '</th>' +
      '<th>' + ap.t('Type') + '</th>' +
      '<th>' + ap.t('Options') + '</th>' +
      '</tr>' +
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
      "title": ap.t("weights"),
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
    };

    data.schema = {
      "table": {
        "type": "markup",
        "markup": tableHtml
      },
      weightFields,
      "label": {
        "type": "text",
        "title": ap.t("Field label")
      },
      "machineName": {
        "type": "text",
        "title": ap.t("Database name"),
      },
      "fieldType": {
        "type": "text",
        "title": ap.t("Field type"),
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
        "title": ap.t("Add new field"),
        "expandable": true,
        "items": [
          {
            "key": "label",
            "onKeyUp": function (evt, node) {
              var label = $("input[name=label]").val();
              label = label.replace(/[^a-zA-Z]+/g, "_").toLowerCase();
              $('#machineNameBuilder').html(label);
              $("input[name=machineName]").val(label);
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
        "title": ap.t("Save")
      }
    ];

    data.value.parentItem = parent;
    data.value.weightFields = weightsList;
    data.value.entityType = entityType;

    thisHook.pass(data);
  } else {
    thisHook.fail(data);
    iris.log("error", "No entityType field passed to hook_form_render__schemaFieldListing");
  }

});

/**
 * Submit handler for form schemaFieldListing.
 * Save the field weights if re-ordered and/or add a new field to this object in the schema.
 */
iris.modules.entityUI.registerHook("hook_form_submit__schemaFieldListing", 0, function (thisHook, data) {

  // Fetch current schema
  var schema = JSON.parse(JSON.stringify(iris.dbSchemaConfig[thisHook.context.params.entityType]));

  var fieldName = thisHook.context.params.fieldName;
  var entityType = thisHook.context.params.entityType;
  var parent = thisHook.context.params.parentItem;

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
  if (typeof thisHook.context.params.weightFields != 'undefined') {
    for (var i = 0; i < thisHook.context.params.weightFields.length; i++) {

      var fieldKey = thisHook.context.params.weightFields[i].machineName.replace('weight_', '');

      var schemaRef = parentItem[fieldKey];

      if (typeof schemaRef["weight"] != "undefined") {
        schemaRef["weight"] = thisHook.context.params.weightFields[i].weight;
      }

    };
  }

  // Prepare new field.
  if (thisHook.context.params.label != '' && thisHook.context.params.machineName != '') {

    if (parentItem.fieldType == 'Fieldset') {
      parentItem = parentItem.subfields;
    }
    parentItem[thisHook.context.params.machineName] = {
      "fieldType": thisHook.context.params.fieldType,
      "label": thisHook.context.params.label,
      "description": "",
      "permissions": [],
      "unique": false,
      "weight": "0"
    };

    if (parentItem[thisHook.context.params.machineName].fieldType == 'Fieldset') {
      parentItem[thisHook.context.params.machineName].subfields = {};
    }

  }

  // Save updated schema.
  iris.saveConfig(schema, "entity", entityType, function (data) {

    iris.dbPopulate();

    thisHook.pass(function (res) {

      iris.message(thisHook.authPass.userid, thisHook.authPass.t("Fields sucessfully saved"), "success");
      var redirect = '/admin/schema/' + entityType;

      if (thisHook.context.params.machineName != '') {
        redirect += '/fields/' + thisHook.context.params.machineName;
      } else {
        if (parent != '') {
          redirect += '/fieldset/' + parent;
        } else {
          redirect += '/fields';
        }
      }
      res.send({
        redirect: redirect
      });

    });

  });

});

iris.modules.entityUI.registerHook("hook_generate_fieldBasicForm", 0, function (thisHook, data) {

  var entityTypeSchema = iris.dbSchemaConfig[thisHook.context.entityType];

  data.value.fields = [];

  var field = thisHook.context.field;

  delete field.type;

  field.about = "<b>Machine name:</b> " + thisHook.context.fieldName + "<br />";
  field.about += "<b>Field type:</b> " + field.fieldType;

  field.machineName = thisHook.context.fieldName;

  data.value.fields = field;


  if (thisHook.context.entityType) {

    data.value.entityTypeName = thisHook.context.entityType;

  }

  data.schema = {
    "entityTypeName": {
      "type": "hidden",
      "title": "Entity type name",
      "required": true,
      "default": thisHook.context.entityType
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
        "edit_permissions": {
          "type": "checkboxbuttons",
          "activeClass": "btn-success",
          "title": "Field edit permissions",
          "items": {
            "enum": Object.keys(iris.modules.auth.globals.roles)
          }
        },
        "required": {
          "type": "boolean",
          "title": "Required field",
          "description": "Should this field be required?"
        },
        "unique": {
          "type": "boolean",
          "title": "Unique field",
          "description": "Should this field be unique for each entity? This option will make it impossible to have two fields of the same value in this entity type."
        }
      }

    }
  }

  thisHook.pass(data);

});

/**
 * Helper function to add basic field settings to each new field.
 * TODO: This should be a hook for others to latch onto.
 */
/*iris.modules.entityUI.globals.basicFieldForm = function (field, fieldName, entityType) {



  return data;
}*/

/**
 * Defines form schema.
 * This is used to add/edit entity types.
 * Only Title and Description are provided by default.
 */
iris.modules.entityUI.registerHook("hook_form_render__schema", 0, function (thisHook, data) {

  // Check entityType field is provided.
  if (thisHook.context.params && thisHook.context.params[1]) {

    var entityType = thisHook.context.params[1];

    if (!iris.dbSchemaConfig[entityType]) {

      iris.message(thisHook.authPass.userid, thisHook.authPass.t("No such entity type"), "danger");

      thisHook.fail(data);

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
      "title": thisHook.authPass.t("Entity type name"),
      "required": true,
      "default": entityType
    },
    "entityTypeDescription": {
      "type": "text",
      "title": "Description",
      "default": schema['entityTypeDescription'] ? schema['entityTypeDescription'] : ''
    }
  }

  data.form = [
      "*",
      {
        "type": "submit",
        "title": "Submit",
        "htmlClass": "submit-form"
      }
    ];

  if (entityType) {

    data.schema.entityTypeName.type = "hidden";

  }

  thisHook.pass(data);

});

/**
 * Submit handler for form schema.
 * Save the base entity details.
 */
iris.modules.entityUI.registerHook("hook_form_submit__schema", 0, function (thisHook, data) {


  var entityType = thisHook.context.params.entityTypeName;
  var finishedSchema = {
    fields: iris.dbSchemaConfig[entityType] && iris.dbSchemaConfig[entityType].fields ? iris.dbSchemaConfig[entityType].fields : {}
  };

  Object.keys(thisHook.context.params).forEach(function (field) {
    finishedSchema[field] = thisHook.context.params[field];
  });

  // Save schema.
  iris.saveConfig(finishedSchema, "entity", iris.sanitizeName(thisHook.context.params.entityTypeName), function (data) {

    iris.dbPopulate();

    data = function (res) {

      // Redirect to entity edit form or entity field settings form depending on how many fields are saved

      if (Object.keys(finishedSchema.fields).length == 0) {

        iris.message(thisHook.authPass.userid, thisHook.authPass.t("New entity type created"), "success");
        res.json({
          redirect: "/admin/schema/" + iris.sanitizeName(thisHook.context.params.entityTypeName) + "/fields"
        });


      } else {

        iris.message(thisHook.authPass.userid, thisHook.authPass.t("Entity type {{type}} has been updated.", {type: entityType}), "success");
        res.json({
          "redirect": "/admin/schema/" + iris.sanitizeName(thisHook.context.params.entityTypeName) + "/edit"
        });

      }

    }

    thisHook.pass(data);

  });

});


/**
 * Defines form schemaField.
 * This form includes the basic form settings as well as field-type specific settings.
 * This could be hooked into to add any further settings to the field.
 */

iris.modules.entityUI.registerHook("hook_form_render__schemafield", 0, function (thisHook, data) {

  data.form = [];
  var entityType = thisHook.context.params[1];
  var fieldName = thisHook.context.params[2];
  var parent = thisHook.context.params[3];

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
    recurseFields(iris.dbSchemaConfig[entityType].fields, parent);


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
    //var basicForm = iris.modules.entityUI.globals.basicFieldForm(field, fieldName, entityType);

    iris.invokeHook("hook_generate_fieldBasicForm", thisHook.authPass, {
        field: field,
        fieldName: fieldName,
        entityType: entityType
      },
      data
    ).then(function (data) {

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
      iris.invokeHook("hook_form_render__field_settings__" + iris.sanitizeName(field["fieldType"]), thisHook.authPass, {
          entityType: entityType,
          fieldName: fieldName,
          schema: iris.dbSchema[entityType]
        },
        data
      ).then(function (form) {

        if (form.schema.settings && !form.settingsOverride) {

          form.form.push("settings");

        }

        form.form.push({
          "type": "submit",
          "title": thisHook.authPass.t("Save field")
        });
        thisHook.pass(form);

      }, function (fail) {

        data.form.push({
          "type": "submit",
          "title": thisHook.authPass.t("Save field")
        });

        iris.log("error", "No field type hook for: " + field["fieldType"]);
        thisHook.pass(data);

      });

    }, function(fail) {

      iris.log("error", "Field failed basic settings form" + fieldName);
      thisHook.fail(data);

    });

    // Merge with the current data object.
    //MergeRecursive(data, basicForm);


  } else {

    iris.log("error", "No field properties found for field" + fieldName);
    thisHook.fail(data);

  }

});

/**
 * Submit handler for form schemaField.
 * Saves the field settings to the entity schema.
 */
iris.modules.entityUI.registerHook("hook_form_submit__schemafield", 0, function (thisHook, data) {

  // Fetch current schema as clone.
  var schema = JSON.parse(JSON.stringify(iris.dbSchemaConfig[thisHook.context.params.entityType]));
  var fieldName = thisHook.context.params.fieldName;
  var entityType = thisHook.context.params.entityType;
  var parent = thisHook.context.params.parent;

  delete thisHook.context.params.entityType;
  delete thisHook.context.params.fieldName;

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
  Object.keys(thisHook.context.params.fields).forEach(function (metaName) {

    if (!savedElement[metaName]) {

      savedElement[metaName] = {};

    }

    savedElement[metaName] = thisHook.context.params.fields[metaName];

  });

  if (savedElement.fieldType == 'Fieldset') {
    savedElement['subfields'] = {};
  }

  // Add field type specific settings.
  if (thisHook.context.params.settings) {
    savedElement.settings = thisHook.context.params.settings;
  }

  // Save and repopulate database schemas

  iris.saveConfig(schema, "entity", entityType, function (data) {
    iris.dbPopulate();
    thisHook.pass(function (res) {

      iris.message(thisHook.authPass.userid, thisHook.authPass.t("Field {{name}} saved on entity {{type}}", {name: fieldName, type: entityType}), "success");

      // If field belongs to a fieldset, redirect back to fieldset manage page.
      if (parent) {

        res.send({
          redirect: "/admin/schema/" + entityType + '/fieldset/' + parent
        });
      } else {

        res.send({
          redirect: "/admin/schema/" + entityType + '/fields'
        });
      }

    });

  });

});

/**
 * Defines form_render_field_settings for Textfields.
 * Here set settings specific to Textfield input fields.
 */
iris.modules.entityUI.registerHook("hook_form_render__field_settings__textfield", 0, function (thisHook, data) {

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

  thisHook.pass(data);

});

/**
 * Defines form_render_field_settings for Fieldsets.
 * Provide a link to manage the fields for this Fieldset.
 */
iris.modules.entityUI.registerHook("hook_form_render__field_settings__fieldset", 0, function (thisHook, data) {

  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": {
      "linkToField": {
        "type": "markup",
        "markup": "<a href=\"/admin/schema/" + data.value.entityType + "/fieldset/" + data.value.fieldName + "\">" + thisHook.authPass.t('Manage subfields') + "</a>"
      }
    }
  }

  thisHook.pass(data);

});

/**
 * Defines form_render_field_settings for Select fields.
 * Provides multiple text fields to enter the select values.
 */
iris.modules.entityUI.registerHook("hook_form_render__field_settings__select", 0, function (thisHook, data) {

  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": {
      "options": {
        "type": "array",
        "title": thisHook.authPass.t("List of options"),
        "items": {
          "type": "text"
        }
      }
    }
  }

  thisHook.pass(data);

});


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
iris.modules.entityUI.registerHook("hook_form_render__schemafieldwidgets", 0, function (thisHook, data) {

  // Fetch current schema

  var entityType = thisHook.context.params[1];
  var fieldName = thisHook.context.params[2];
  var parent = thisHook.context.params[3];
  var schema = JSON.parse(JSON.stringify(iris.dbSchemaConfig[entityType]));

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
    recurseFields(iris.dbSchemaConfig[entityType].fields, parent);


  } else if (iris.dbSchema[entityType] && iris.dbSchema[entityType][fieldName]) {

    // Field is not nested.
    field = iris.dbSchema[entityType][fieldName];
  }

  var fieldTypeName = field.fieldType;


  if (iris.modules.entityUI.globals.fieldWidgets[fieldTypeName]) {

    var widgets = iris.modules.entityUI.globals.fieldWidgets[fieldTypeName];

  } else {

    // If no widgets are defined. Show help message.
    data.schema.help =
    {
      "type": "object",
      "properties": {
        help: {
          type: 'markup',
          markup: thisHook.authPass.t("No widgets available for this field")
        }
      }
    };
    data.form = ['help'];

    thisHook.pass(data);
    return false;

  }

  // Add widgets to form

  Object.keys(widgets).forEach(function (widgetName) {

    data.schema[widgetName] = {
      type: "object",
      properties: widgets[widgetName] ? widgets[widgetName] : {
        empty: {
          "type": "markup",
          "markup": thisHook.authPass.t("This widget has no settings")
        }
      }
    };

  });

  data.schema.widgetChoice = {
    "type": "string",
    "title":thisHook.authPass.t( "Make a choice"),
    "enum": Object.keys(widgets),
    "description" : thisHook.authPass.t("Pick a widget to use to display this field to the user on entity forms")
  }

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

  data.form = [{
    "type": "selectfieldset",
    "title": thisHook.authPass.t("Make a choice"),
    "key": "widgetChoice",
    "items": []
    }];

  Object.keys(widgets).forEach(function (widgetName) {

    data.form[0].items.push({
      key: widgetName,
      "legend": widgetName
    })

  })

  data.form.push({
    key: "entityType",
  })

  data.form.push({
    key: "fieldName",
  });

  data.form.push({
    key: "parent",
  });

  data.form.push({
    type: "submit",
    value: thisHook.authPass.t("Save widget settings")
  })

  // Check if widgets already set and prepopulate form if so

  if (schema.fields[fieldName].widget) {

    data.value = {};

    data.value.widgetChocie = schema.fields[fieldName].widget.name;

    data.value[schema.fields[fieldName].widget.name] = schema.fields[fieldName].widget.settings;

    data.value.entityType = entityType;
    data.value.fieldName = fieldName;

  }

  thisHook.pass(data);

});

/**
 * Submit handler for form schemafieldwidgets.
 * Save the chosen widget for a given field.
 */
iris.modules.entityUI.registerHook("hook_form_submit__schemafieldwidgets", 0, function (thisHook, data) {

  var entityType = thisHook.context.params.entityType;
  var fieldName = thisHook.context.params.fieldName;
  var parent = thisHook.context.params.parent;

  // Get current schema

  var schema = iris.dbSchemaConfig[entityType];

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

  // Slot in widget settings
  var widgetChoice = thisHook.context.params.widgetChoice;

  savedElement.widget = {
    name: widgetChoice,
    settings: thisHook.context.params[widgetChoice]
  };

  // Prepare schema object for saving

  var newSchema = {
    entityTypeName: entityType,
    fields: schema.fields
  };

  /*iris.dbSchemaConfig[entityType].fields[fieldName].widget = {
    name: widgetChoice,
    settings: thisHook.context.params[widgetChoice]
  };*/

  iris.saveConfig(newSchema, "entity", iris.sanitizeName(entityType), function (data) {

    iris.dbPopulate();

    data = function (res) {

      res.send({
        "redirect": "/admin/schema/" + iris.sanitizeName(entityType) + "/fields"
      });

    }

    thisHook.pass(data);

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
