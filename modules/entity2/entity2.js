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

        var fieldTypeName = schemafile.split("_")[1];
        var fieldTypeType = schemafile.split("_")[0];

        var fieldSchema = {};

        // Add extra fields to top

        fieldSchema.title = {
          "type": "string",
          "title": "Field Title"
        }

        fieldSchema.fieldTypeName = {
          "type": "hidden",
          "default": fieldTypeName
        }

        fieldSchema.fieldTypeType = {
          "type": "hidden",
          "default": fieldTypeType
        }

        fieldSchema.required = {
          "title": "Required",
          "type": "boolean"
        }

        // Parse file

        var filedSchema = JSON.parse(fs.readFileSync(CM[moduleName].path + "/schema_fields/" + schemafile + ".json"));

        Object.keys(filedSchema).forEach(function (field) {

          fieldSchema[field] = filedSchema[field];

        })

        // TODO : Validation at this point to check for bad fields

        // Add fieldtype to memory index if it doesn't already exist

        if (!CM.entity2.globals.fieldTypes[fieldTypeType]) {

          CM.entity2.globals.fieldTypes[fieldTypeType] = {};

        }

        if (!CM.entity2.globals.fieldTypes[fieldTypeType][fieldTypeName]) {

          CM.entity2.globals.fieldTypes[fieldTypeType][fieldTypeName] = fieldSchema;

        } else {

          // Cascade in other schemas for this field if available

          Object.keys(fieldSchema).forEach(function (field) {

            CM.entity2.globals.fieldTypes[fieldTypeType][fieldTypeName][field] = fieldSchema[field];

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

  Object.keys(CM.entity2.globals.fieldTypes).forEach(function (fieldType) {

    Object.keys(CM.entity2.globals.fieldTypes[fieldType]).forEach(function (field) {

      var fieldConfig = CM.entity2.globals.fieldTypes[fieldType][field];

      schemaFormFields[fieldType + "_" + field] = {

        "type": "object",
        "title": field

      }

      // Add properties

      schemaFormFields[fieldType + "_" + field].properties = fieldConfig;

    })

  });

  // add choose field

  schemaFormFields["choose"] = {
    "type": "choose"
  };

  // add in object field for field collections

  schemaFormFields["object"] = {
    "type": "object",
    "title": "options",
    "properties": {
      "system-name": {
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
