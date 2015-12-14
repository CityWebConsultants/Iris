C.registerModule("entity2");

var fs = require("fs");

// Store field types in memory

CM.entity2.globals.fieldTypes = {};

// Generate form for schema edit/create

CM.entity2.globals.fetchSchemaForm = function () {

  // Search all enabled module paths for fieldSchema directories and schema

  Object.keys(CM).forEach(function (moduleName) {

    try {
      fs.readdirSync(CM[moduleName].path + "/schema_fields").forEach(function (schemafile) {

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

        fieldSchema.required = {
          "title": "Required",
          "type": "boolean"
        }

        // Parse file

        var filedSchema = JSON.parse(fs.readFileSync(CM[moduleName].path + "/schema_fields/" + schemafile + ".json"));

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


        if (!CM.entity2.globals.fieldTypes[fieldTypeMachineName]) {

          CM.entity2.globals.fieldTypes[fieldTypeMachineName] = fieldSchema;

        } else {

          // Cascade in other schemas for this field if available

          Object.keys(fieldSchema).forEach(function (field) {

            CM.entity2.globals.fieldTypes[fieldTypeMachineName][field] = fieldSchema[field];

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

  Object.keys(CM.entity2.globals.fieldTypes).forEach(function (field) {

    var fieldConfig = CM.entity2.globals.fieldTypes[field];

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

CM.entity2.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var name = thisHook.const.field.fieldTypeName;
  var type = CM.entity2.globals.fieldTypes[thisHook.const.field.fieldTypeName].fieldTypeType;

  if (type === "string") {

    data = {
      type: "string",
      title: thisHook.const.field.title,
      required: thisHook.const.field.required,
      description: thisHook.const.field.description,
      default: thisHook.const.value
    }

    thisHook.finish(true, data);

  } else if (type === "ofstring") {

    data = {
      type: "array",
      required: thisHook.const.field.required,
      title: thisHook.const.field.title,
      "description": thisHook.const.field.description,
      items: {
        type: "string"
      },
      "default": thisHook.const.value
    }

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, data);

  }

});

// Field save handler

CM.entity2.registerHook("hook_entityfield_save", 0, function (thisHook, data) {

  var fieldSchema = thisHook.const.schema,
    value = thisHook.const.value,
    fieldName = thisHook.const.schema.fieldTypeName,
    fieldType = CM.entity2.globals.fieldTypes[thisHook.const.schema.fieldTypeName].fieldTypeType;

  if (fieldType === "string") {

    thisHook.finish(true, thisHook.const.value)

  } else if (fieldType === "ofstring") {

    thisHook.finish(true, thisHook.const.value)

  } else {

    thisHook.finish(false, data);

  }

});

// Entity create form handler

CM.entity2.registerHook("hook_form_submit_createEntity", 0, function (thisHook, data) {

  console.log(thisHook.const.params);

  // Get type from url
  // Get the schema for the requested type to get the widgets
  // Get the submitted form values

  var type = thisHook.const.req.url.split("/")[3],
    schema = C.dbSchemaJSON[type],
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

      C.hook("hook_entity_create", thisHook.authPass, formData, formData).then(function (success) {

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

    C.hook("hook_entityfield_save", thisHook.authPass, widget, {}).then(function (result) {

      formData[widget.fieldName] = result;

      done();

    }, function (fail) {

      done();

    })

  });

});

// Entity edit form handler ( TODO: should merge this with create as they're pretty much the same thing)

// Entity create form handler

CM.entity2.registerHook("hook_form_submit_editEntity", 0, function (thisHook, data) {

  // Get type from url
  // Get the schema for the requested type to get the widgets
  // Get the submitted form values

  var type = thisHook.const.req.url.split("/")[3],
    schema = C.dbSchemaJSON[type],
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

      C.hook("hook_entity_edit", thisHook.authPass, formData, formData).then(function (success) {

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

    C.hook("hook_entityfield_save", thisHook.authPass, widget, {}).then(function (result) {

      formData[widget.fieldName] = result;

      done();

    }, function (fail) {

      done();

    })

  });

});



// Create entity form

CM.entity2.registerHook("hook_form_render_createEntity", 0, function (thisHook, data) {

  // Check if entity type exists

  var type = thisHook.const.params[1],
    schema = C.dbSchemaJSON[type];

  var widgets = {};

  var doneCount = 0;

  var done = function () {

    doneCount += 1;

    if (doneCount === Object.keys(schema).length) {

      data.schema = widgets;

      thisHook.finish(true, data);

    }

  }

  if (schema) {

    Object.keys(schema).forEach(function (fieldName) {

      C.hook("hook_render_entityfield_form", thisHook.authPass, {
        field: schema[fieldName],
        value: null
      }, {}).then(function (form) {

        widgets[fieldName] = form;

        done();

      }, function (fail) {

        done();

      })

    });

  } else {

    thisHook.finish(false, data);

  }

});

// Edit entity form

// Create entity form

CM.entity2.registerHook("hook_form_render_editEntity", 0, function (thisHook, data) {

  // Check if entity type exists

  var type = thisHook.const.params[1],
    id = thisHook.const.params[2],
    schema = C.dbSchemaJSON[type];

  if (!schema) {

    thisHook.finish(false, data);
    return false;

  }

  // Load in entity to get defaults

  C.dbCollections[type].findOne({
    eid: id
  }, function (err, current) {

    if (err) {

      thisHook.finish(false, err);
      return false;

    }

    var widgets = {};

    var doneCount = 0;

    var done = function () {

      doneCount += 1;

      if (doneCount === Object.keys(schema).length) {

        data.schema = widgets;

        thisHook.finish(true, data);

      }

    }

    Object.keys(schema).forEach(function (fieldName) {

      C.hook("hook_render_entityfield_form", thisHook.authPass, {
        field: schema[fieldName],
        value: current[fieldName]
      }, {}).then(function (form) {

        widgets[fieldName] = form;

        done();

      }, function (fail) {

        done();

      })

    });

  });

});
