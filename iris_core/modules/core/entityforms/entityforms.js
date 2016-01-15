/**
 * @file Forms and form handlers for creating and editing forms, plus string widgets
 */

iris.registerModule("entityforms");

var fs = require("fs");

// Store field types in memory

iris.modules.entityforms.globals.fieldTypes = {};

/**
 * Generate form for schema edit/create
 */
iris.modules.entityforms.globals.fetchSchemaForm = function () {

  // Search all enabled module paths for fieldSchema directories and schema

  Object.keys(iris.modules).forEach(function (moduleName) {

    try {
      fs.readdirSync(iris.modules[moduleName].path + "/schema_fields").forEach(function (schemafile) {

        // Cut off .json part

        schemafile = schemafile.toLowerCase().replace(".json", "");

        // Get field name and fieldtype

        var fieldTypeMachineName = schemafile;

        var fieldSchema = {};

        // Add extra fields to top

        fieldSchema.title = {
          "type": "string",
          "title": "Field Title"
        }

        fieldSchema.label = {
          "type": "string",
          "title": "Label"
        }

        fieldSchema.description = {
          "type": "string",
          "title": "Field Description"
        }

        fieldSchema.required = {
          "title": "Required",
          "type": "boolean"
        }

        // Add in field permissions

        fieldSchema.canViewField = {
          "type": "array",
          "selector": "permission",
          "title": "Can view field on the client side",
          "description": "If you disable this permission, even if a role has access to an entity type they will not be able to view this field when it is rendered in a template or fetched via the API",
          "items": {
            "type": "string",
            "enum": Object.keys(iris.modules.auth.globals.roles)
          }
        };

        //        fieldSchema.canEditField = {
        //          "type": "array",
        //          "selector": "permission",
        //          "title": "Can view field on edit/delete forms",
        //          "description": "If you disable this permission on a required field a user may not be able to save the entity properly",
        //          "items": {
        //            "type": "string",
        //            "enum": Object.keys(iris.modules.auth.globals.roles)
        //          }
        //        };


        // Parse file

        var filedSchema = JSON.parse(fs.readFileSync(iris.modules[moduleName].path + "/schema_fields/" + schemafile + ".json"));

        if (filedSchema.fieldTypeName) {

          var fieldTypeName = filedSchema.fieldTypeName

          fieldSchema.fieldTypeName = {
            "type": "hidden",
            "title": fieldTypeName,
            "default": fieldTypeMachineName
          }

        }


        Object.keys(filedSchema).forEach(function (field) {

          if (field !== "fieldTypeName") {

            fieldSchema[field] = filedSchema[field];

          }

        })

        // TODO : Validation at this point to check for bad fields

        // Add fieldtype to memory index if it doesn't already exist


        if (!iris.modules.entityforms.globals.fieldTypes[fieldTypeMachineName]) {

          iris.modules.entityforms.globals.fieldTypes[fieldTypeMachineName] = fieldSchema;

        } else {

          // Cascade in other schemas for this field if available

          Object.keys(fieldSchema).forEach(function (field) {

            iris.modules.entityforms.globals.fieldTypes[fieldTypeMachineName][field] = fieldSchema[field];

          })

        }

      });

    } catch (e) {

      if (e.code !== "ENOENT") {

        console.log(e);

      }

    }

  });

  // Put together form

  var schemaFormFields = {};

  // add choose field

  schemaFormFields["choose"] = {
    "type": "choose"
  };

  Object.keys(iris.modules.entityforms.globals.fieldTypes).forEach(function (field) {

    var fieldConfig = iris.modules.entityforms.globals.fieldTypes[field];

    schemaFormFields[field] = {

      "type": "object",

    }

    // Add properties

    schemaFormFields[field].properties = {};

    Object.keys(fieldConfig).forEach(function (fieldName) {

      schemaFormFields[field].properties[fieldName] = fieldConfig[fieldName];

    })

  });

  // add in object field for field collections

  schemaFormFields["object"] = {
    "type": "object",
    "title": "options",
    "properties": {
      "title": {
        "type": "string",
        "title": "System name",
        "description": "The name of the field when stored in the database (this can't be changed easily once set)",
        "required": true
      },
      "label": {
        "type": "string",
        "title": "Label"
      },
      "required": {
        "type": "boolean",
        "title": "Is this field required?"
      },
      "description": {
        "type": "textarea",
        "title": "Description"
      },
      "subfields": {
        "type": "array",
        "title": "Fields",
        "items": {
          "type": "object",
          "title": "option",
          "properties": {
            "choose": {
              "type": "choose"
            }
          }
        }
      }
    }
  }

  return schemaFormFields;

}

// Base level widgets

iris.modules.entityforms.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var name = thisHook.const.field.fieldTypeName;
  var type = iris.modules.entityforms.globals.fieldTypes[thisHook.const.field.fieldTypeName].fieldTypeType;

  if (name === "longstring") {

    data = {
      "type": "textarea",
      "title": thisHook.const.field.label || thisHook.const.field.label,
      "required": thisHook.const.field.required,
      "description": thisHook.const.field.description,
      "default": thisHook.const.value
    }

    thisHook.finish(true, data);

  } else if (type === "string") {

    data = {
      type: "string",
      title: thisHook.const.field.label || thisHook.const.field.title,
      required: thisHook.const.field.required,
      description: thisHook.const.field.description,
      default: thisHook.const.value
    }

    thisHook.finish(true, data);

  } else if (type === "ofstring") {

    data = {
      type: "array",
      required: thisHook.const.field.required,
      title: thisHook.const.field.label || thisHook.const.field.title,
      "description": thisHook.const.field.description,
      items: {
        type: "string"
      },
      "default": thisHook.const.value
    }

    thisHook.finish(true, data);

  } else if (type === "boolean") {

    data = {
      type: "boolean",
      title: thisHook.const.field.label || thisHook.const.field.title,
      required: thisHook.const.field.required,
      description: thisHook.const.field.description,
      default: thisHook.const.value
    };

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, data);

  }

});

// Field save handler

iris.modules.entityforms.registerHook("hook_entityfield_save", 0, function (thisHook, data) {

  var fieldSchema = thisHook.const.schema,
    value = thisHook.const.value,
    fieldName = thisHook.const.schema.fieldTypeName,
    fieldType = iris.modules.entityforms.globals.fieldTypes[thisHook.const.schema.fieldTypeName].fieldTypeType;

  if (fieldType === "string") {

    thisHook.finish(true, thisHook.const.value)

  } else if (fieldType === "ofstring") {

    thisHook.finish(true, thisHook.const.value)

  } else if (fieldType === "boolean") {

    thisHook.finish(true, thisHook.const.value)

  } else {

    thisHook.finish(false, data);

  }

});

// Entity create form handler

iris.modules.entityforms.registerHook("hook_form_submit_createEntity", 0, function (thisHook, data) {

  // Get type from url
  // Get the schema for the requested type to get the widgets
  // Get the submitted form values

  var type = thisHook.const.req.url.split("/")[3],
    schema = iris.dbSchemaJSON[type],
    values = thisHook.const.params;

  // Gather array of field value/widgets pairs

  var widgetValues = [];

  Object.keys(values).forEach(function (field) {

    if (schema[field]) {

      widgetValues.push({
        schema: schema[field],
        value: values[field],
        fieldName: field
      });

    }

  });

  // Loop over all widgets to assemble a saved entity

  var formData = {};

  var doneCount = 0;

  var done = function () {

    doneCount += 1;

    if (doneCount === widgetValues.length) {

      formData.entityType = type;

      iris.hook("hook_entity_create", thisHook.authPass, formData, formData).then(function (success) {

        data = function (res) {

          res.send("/admin/entitylist/" + type)

        }

        thisHook.finish(true, data);

      }, function (fail) {

        thisHook.finish(true, function (res) {

          res.send({
            errors: fail
          });

        });

      });

    }

  }

  widgetValues.forEach(function (widget) {

    iris.hook("hook_entityfield_save", thisHook.authPass, widget, {}).then(function (result) {

      formData[widget.fieldName] = result;

      done();

    }, function (fail) {

      done();

    })

  });

});

// Entity edit form handler ( TODO: should merge this with create as they're pretty much the same thing)

// Entity create form handler

iris.modules.entityforms.registerHook("hook_form_submit_editEntity", 0, function (thisHook, data) {

  // Get type from url
  // Get the schema for the requested type to get the widgets
  // Get the submitted form values

  var type = thisHook.const.req.url.split("/")[3],
    schema = iris.dbSchemaJSON[type],
    eid = thisHook.const.req.url.split("/")[4],
    values = thisHook.const.params;

  // Gather array of field value/widgets pairs

  var widgetValues = [];

  Object.keys(values).forEach(function (field) {

    if (schema[field]) {

      widgetValues.push({
        schema: schema[field],
        value: values[field],
        fieldName: field
      });

    }

  });

  // Loop over all widgets to assemble a saved entity

  var formData = {};

  var doneCount = 0;

  var done = function () {

    doneCount += 1;

    if (doneCount === widgetValues.length) {

      formData.entityType = type;
      formData.eid = eid;

      iris.hook("hook_entity_edit", thisHook.authPass, formData, formData).then(function (success) {

        var data = function (res) {

          res.send("/admin/entitylist/" + type)

        }

        thisHook.finish(true, data);

      }, function (fail) {

        console.log(fail);

        thisHook.finish(false, fail);

      });

    }

  }

  widgetValues.forEach(function (widget) {

    iris.hook("hook_entityfield_save", thisHook.authPass, widget, {}).then(function (result) {

      formData[widget.fieldName] = result;

      done();

    }, function (fail) {

      done();

    })

  });

});

// Function for converting schema field to form

var schemaToForm = function (schema, entity) {

  var fieldToSchema = function (fieldName, root) {

    return new Promise(function (yes, no) {

      if (root[fieldName].subfields) {

        // It's a field collection!

        var output = {
          type: "object",
          properties: {}
        };

        yes(output);

        var subFieldCounter = 0;

        var next = function () {

          subFieldCounter += 1;

          if (subFieldCounter === Object.keys(root[fieldName].subfields).length) {

            yes(output);

          }

        }

        // Loop over sub fields

        Object.keys(root[fieldName].subfields).forEach(function (subFieldName) {

          fieldToSchema(subFieldName, root[fieldName].subfields).then(function (result) {

            output.properties[subFieldName] = result;
            next();

          })

        })

      } else {

        iris.hook("hook_render_entityfield_form", "root", {
          field: root[fieldName],
          value: entity ? entity[fieldName] : null
        }, {}).then(function (form) {

          yes(form);

        }, function (fail) {

          no(fail);

        })

      }

    })

  }


  return new Promise(function (yes, no) {

    var output = {};

    var counter = 0;

    var done = function () {

      counter += 1;

      if (counter === Object.keys(schema).length) {

        yes(output);

      }

    }

    Object.keys(schema).forEach(function (fieldName) {

      fieldToSchema(fieldName, schema).then(function (result) {

        output[fieldName] = result;
        done();

      }, function (fail) {

        no(fail);
        iris.log("error", fail);

      })

    })

  })

};

// Create entity form

iris.modules.entityforms.registerHook("hook_form_render_createEntity", 0, function (thisHook, data) {

  // Check if entity type exists

  var type = thisHook.const.params[1],
    schema = iris.dbSchemaJSON[type];

  if (schema) {

    schemaToForm(schema).then(function (result) {

      data.schema = result;

      thisHook.finish(true, data);

    }, function (fail) {

      console.log(fail);

    });

  } else {

    thisHook.finish(false, data);

  }

});

// Edit entity form

// Create entity form

iris.modules.entityforms.registerHook("hook_form_render_editEntity", 0, function (thisHook, data) {

  // Check if entity type exists

  var type = thisHook.const.params[1],
    id = thisHook.const.params[2],
    schema = iris.dbSchemaJSON[type];

  if (!schema) {

    thisHook.finish(false, data);
    return false;

  }

  // Load in entity to get defaults

  iris.dbCollections[type].findOne({
    eid: id
  }, function (err, current) {

    if (err) {

      thisHook.finish(false, err);
      return false;

    }

    schemaToForm(schema, current).then(function (result) {

      data.schema = result;

      thisHook.finish(true, data);

    }, function (fail) {

      thisHook.finish(false, fail);

    });

  })
})
