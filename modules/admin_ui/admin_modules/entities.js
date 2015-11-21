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

  C.readConfig("entity", req.params.type).then(function (config) {

    var fields = [];

    // TODO : field collection fields

    Object.keys(config).forEach(function (field) {

      // Check if has subfields

      if (config[field].subfields) {

        var choose = fieldTypes["object"];

        var editBundle = {};

        editBundle["choose"] = choose.toString() - 1;

        editBundle["object"] = config[field];

        var subFields = [];

        Object.keys(config[field].subfields).forEach(function (subfieldName) {

          var subfield = {};

          var fieldType = config[field].subfields[subfieldName].fieldTypeType + "_" + config[field].subfields[subfieldName].fieldTypeName;

          subfield[fieldType] = config[field].subfields[subfieldName];

          subfield.choose = fieldTypes[fieldType].toString();

          subFields.push(subfield);

        })

        config[field].subfields = subFields;

        fields.push(editBundle);

      } else {
        var fieldType = config[field].fieldTypeType + "_" + config[field].fieldTypeName;

        var choose = fieldTypes[fieldType];

        var editBundle = {};

        editBundle["choose"] = choose.toString();
        editBundle[fieldType] = config[field];

        fields.push(editBundle);
      }

    })

    res.send(fields);

  }, function (fail) {

    res.send(fail);

  });

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
