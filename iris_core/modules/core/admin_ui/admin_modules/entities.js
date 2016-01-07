var path = require('path');

iris.app.get("/admin/api/entitytypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    res.send(Object.keys(iris.dbCollections));

  } else {

    res.redirect("/admin");

  }

});

iris.app.post("/admin/api/schema/save/:type", function (req, res) {

  if (req.body.entityname) {

    var type = req.body.entityname;

  } else {

    var type = req.params.type;

  }

  var savedSchema = {};

  // Function for processing field

  var processField = function (field) {

    if (field.required) {

      field.required = Boolean(field.required);

    }

    if (field.choose) {
      delete field.choose;
    }

    // Check if field collection

    if (field.subfields) {

      var subfields = {};

      field.subfields.forEach(function (subfield, subFieldindex) {

        Object.keys(subfield).forEach(function (fieldName) {

          if (fieldName !== "choose") {

            subfields[subfield[fieldName].title] = processField(subfield[fieldName]);

          }

        });

        field.subfields = subfields;

      });

    }

    return field;

  }

  Object.keys(req.body.fields).forEach(function (field) {

    Object.keys(req.body.fields[field]).forEach(function (fieldName) {

      if (fieldName !== "choose") {

        savedSchema[req.body.fields[field][fieldName].title] = processField(req.body.fields[field][fieldName]);

      }

    })

  });

  iris.saveConfig(savedSchema, "entity", iris.sanitizeFileName(type), function () {

    iris.dbPopulate();

    res.redirect("/admin/entities");

  });

});

// For: Page for creating a new schema

// Get list of fields

iris.app.get("/admin/api/schema/fieldtypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    var fields = JSON.parse(JSON.stringify(iris.modules.entityforms.globals.fetchSchemaForm()));

    // Schema fields prerender promises for prepopulating data

    var fieldCounter = 0;

    var next = function () {

      if (fieldCounter === Object.keys(fields).length - 2) {

        res.respond(200, fields);

      } else {

        fieldCounter += 1;

      }

    };

    Object.keys(fields).forEach(function (field) {

      if (fields[field].properties && fields[field].properties.fieldTypeType) {

        // Hide field type field, not needed

        delete fields[field].properties.fieldTypeType;

      }

      // Run schemafield preprocess hook for each field

      iris.hook("hook_schemafield_render", "root", {
        field: fields[field]
      }, fields[field]).then(function (fieldOutput) {

        fields[field] = fieldOutput;

        next();

      }, function (fail) {

        res.respond(500);

      });

    })

  } else {

    res.redirect("/admin");

  }

});

iris.modules.admin_ui.registerHook("hook_schemafield_render", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

// Fetch existing schema

iris.app.get("/admin/api/schema/edit/:type/form", function (req, res) {

  // Get field types for referencing drop down choice numbers in form

  var fieldTypes = {};

  Object.keys(iris.modules.entityforms.globals.fetchSchemaForm()).forEach(function (fieldType, index) {

    fieldTypes[fieldType] = index;

  })

  var config = iris.dbSchemaJSON[req.params.type];

  var util = require("util");

  var fields = [];

  var fieldParse = function (field, machinename) {

    field.title = machinename;

    if (field.subfields) {

      var choose = fieldTypes["object"];

      var editBundle = {};

      editBundle["choose"] = (choose - 1).toString();

      editBundle["object"] = field;

      var subFields = [];

      Object.keys(field.subfields).forEach(function (subfieldName) {

        subFields.push(fieldParse(field.subfields[subfieldName]));

      })

      field.subfields = subFields;

      return editBundle;

    } else {

      var fieldType = field.fieldTypeName;

      var choose = fieldTypes[fieldType];

      var editBundle = {};

      editBundle["choose"] = (choose - 1).toString();
      editBundle[fieldType] = field;

      return editBundle;
    }

  }

  Object.keys(config).forEach(function (field) {

    // Check if has subfields

    fields.push(fieldParse(config[field], field));

  })

  res.send(fields);

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
