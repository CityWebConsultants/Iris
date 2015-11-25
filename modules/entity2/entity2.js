C.registerModule("entity2");

var fs = require("fs");

// Store field types in memory

CM.entity2.globals.fieldTypes = {};

// Generate schema form by searching for fields

C.app.get("/admin/editschema", function (req, res) {

  // Search all enabled module paths for fieldSchema directories and schema

  Object.keys(CM).forEach(function (moduleName) {

    try {
      fs.readdirSync(CM[moduleName].path + "/schema_fields").forEach(function (schemafile) {

        // Cut off .json part

        schemafile = schemafile.toLowerCase().replace(".json", "");

        // Get field name and fieldtype

        var fieldTypeName = schemafile.split("_")[1];
        var fieldTypeType = schemafile.split("_")[0];

        // Parse file

        var fieldSchema = JSON.parse(fs.readFileSync(CM[moduleName].path + "/schema_fields/" + schemafile + ".json"));

        // Add extra fields

        fieldSchema.title = {
          "type": "string",
          "title": "Field Title "
        }

        fieldSchema.fieldTypeName = {
          "type": "hidden",
          "default": fieldTypeName
        }

        fieldSchema.fieldTypeType = {
          "type": "hidden",
          "default": fieldTypeType
        }

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

  res.send(CM.entity2.globals.fieldTypes);

})
