var path = require('path');

C.app.get("/admin/api/entitytypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    res.send(Object.keys(C.dbCollections));

  } else {

    res.redirect("/admin");

  }

});

C.app.post("/admin/api/schema/save/:type", function (req, res) {

  if (req.body.entityname) {

    var type = req.body.entityname;

  } else {

    var type = req.params.type;

  }

  var savedSchema = {};

  // Function for processing field

  var processField = function (field) {

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

  C.saveConfig(savedSchema, "entity", type, function () {

    C.dbPopulate();

    res.redirect("/admin/entities");

  });

});

// For: Page for creating a new schema

// Get list of fields

C.app.get("/admin/api/schema/fieldtypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    res.respond(200, CM.entity2.globals.fetchSchemaForm());

  } else {

    res.redirect("/admin");

  }

});

// Fetch existing schema

C.app.get("/admin/api/schema/edit/:type/form", function (req, res) {

  // Get field types for referencing drop down choice numbers in form

  var fieldTypes = {};

  Object.keys(CM.entity2.globals.fetchSchemaForm()).forEach(function (fieldType, index) {

    fieldTypes[fieldType] = index;

  })

  var config = C.dbSchemaJSON[req.params.type];

  var util = require("util");

  var fields = [];

  var fieldParse = function (field) {

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

      var fieldType = field.fieldTypeType + "_" + field.fieldTypeName;

      var choose = fieldTypes[fieldType];

      var editBundle = {};

      editBundle["choose"] = (choose - 1).toString();
      editBundle[fieldType] = field;

      return editBundle;
    }

  }

  Object.keys(config).forEach(function (field) {

    // Check if has subfields

    fields.push(fieldParse(config[field]));

  })

  res.send(fields);

});

// Example widget

CM.entity2.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var type = thisHook.const.type;
  var name = thisHook.const.name;

  var schema = {
    type: "string",
    title: type,
    description: name
  }

  thisHook.finish(true, schema);

});


// Create entity form

CM.forms.registerHook("hook_form_render_createEntity", 0, function (thisHook, data) {

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

      var field = {
        name: schema[fieldName].fieldTypeName,
        type: schema[fieldName].fieldTypeType
      }

      C.hook("hook_render_entityfield_form", thisHook.authPass, field, null).then(function (form) {

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

//CK Editor file upload

var busboy = require('connect-busboy');

C.app.use(busboy());

var fs = require('fs');

C.app.post('/admin/file/fileFieldUpload', function (req, res) {

  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    fstream = fs.createWriteStream(C.sitePath + '/files/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {

      res.end(filename);

    });
  });

});

C.app.post('/admin/api/file/upload', function (req, res) {

  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    fstream = fs.createWriteStream(C.sitePath + '/files/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {

      res.end("<script>window.parent.CKEDITOR.tools.callFunction('" + req.query.CKEditorFuncNum + "','/files/" + filename + "','Uploaded!');</script>");

    });
  });

});

CM.admin_ui.globals.prepareEntitylist = function (type, callback) {

  // Query for all entities of this type

  if (C.dbCollections[type]) {

    var fields = [];

    C.dbCollections[type].find({}, function (err, doc) {

      if (!err) {

        callback({
          entities: doc,
          fields: fields
        });

      } else {

        C.log("error", "Database error while fetching entities");

        callback({});

      }

    })

  } else {

    C.log("error", "Request for invalid entity type");

    callback({});

  }

}
