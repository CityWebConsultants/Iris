var path = require('path');

C.app.get("/admin/api/entitytypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    res.send(Object.keys(C.dbCollections));

  } else {

    res.redirect("/admin");

  }

});

C.app.post("/admin/api/schema/save", function (req, res) {
    
  var savedSchema = {};

  // Function for processing field

  var processField = function (field) {

    if (field.choose) {
      delete field.choose;
    }

    // Check if field collection

    if (field.subfields) {

      var subfields = {};

      field.subfields.forEach(function (subfield) {

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

  C.saveConfig(savedSchema, "entity", req.body.entityname, function () {

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
      
      var fieldType = config[field].fieldTypeType + "_" + config[field].fieldTypeName;
      
      var choose = fieldTypes[fieldType];

      var editBundle = {};
            
      editBundle["choose"] = choose.toString();
      editBundle[fieldType] = config[field];
      
      fields.push(editBundle);

    })

    res.send(fields);

  }, function (fail) {

    res.send(fail);

  });

});

//Create and edit forms

C.app.get("/admin/api/edit/:type/:_id/form", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    if (!C.dbCollections[req.params.type]) {

      res.respond(400, "No such type");
      return false;

    }

    C.dbCollections[req.params.type].findOne({
      "_id": req.params._id
    }, function (err, doc) {

      if (err) {

        res.respond(500, "Database error");

      }

      if (doc) {

        editForm(doc);

      } else {

        res.respond(400, "Entity not found");

      }

    });

    var editForm = function (doc) {

      var tree = C.dbCollections[req.params.type].schema.tree;

      var newTree = {
        schema: {}
      };

      Object.keys(tree).forEach(function (item) {

        if (item === "id" || item === "_id" || item === "__v" || item === "entityType" || item === "entityAuthor" || item === "eId") {

          return false;

        }

        if (checkField(item, tree[item])) {

          newTree.schema[item] = checkField(item, tree[item]);

        }

      })

      newTree.form = [
    "*",
        {
          "type": "submit",
          "title": "Save"
    }
  ];

      newTree.value = doc;

      if (newTree.value.password) {

        // Hide hashed password from edit view
        newTree.value.password = '';

        newTree.schema.password.description = 'Leave blank to keep the same.'

        newTree.schema.password.required = false;

      }

      res.send(newTree);

    }

  } else {

    res.redirect("/admin");

  }

});

C.app.get("/admin/api/create/:type/form/", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    if (!C.dbCollections[req.params.type]) {

      res.respond(400, "No such type");
      return false;

    }

    var tree = C.dbCollections[req.params.type].schema.tree;

    var newTree = {
      schema: {}
    };

    Object.keys(tree).forEach(function (item) {

      if (item === "id" || item === "_id" || item === "__v" || item === "entityType" || item === "entityAuthor" || item === "eId") {

        return false;

      }

      if (checkField(item, tree[item])) {

        newTree.schema[item] = checkField(item, tree[item]);

      }

    })

    newTree.form = [
    "*",
      {
        "type": "submit",
        "title": "Save"
    }
  ];

    res.send(newTree);

  } else {

    res.redirect("/admin");

  }

});

var checkField = function (key, item) {

  if (item === String) {

    return {

      "title": key,
      "type": "string",
      "required": item.required

    };

  }

  var type = item.type;

  if (type === Date) {

    return {

      "title": item.title,
      "description": item.description,
      "type": "date",
      "required": item.required

    };


  }

  if (type === String) {

    if (item.enum) {

      return {

        "title": item.title,
        "description": item.description,
        "type": "string",
        "required": item.required,
        "enum": item.enum

      };

    } else if (item.long) {

      return {

        "title": item.title,
        "description": item.description,
        "type": "textarea",
        "required": item.required,
        "allowedTags": item.allowedTags

      };

    } else if (item.fileTypes) {

      return {

        "title": item.title,
        "fileTypes": item.fileTypes,
        "description": item.description,
        "type": "fileField",
        "required": item.required,

      }

    } else {

      return {

        "title": item.title,
        "description": item.description,
        "type": "string",
        "required": item.required,

      };

    }

  }

  if (item.type === Boolean) {

    return {

      "title": key,
      "type": "boolean",
      "required": item.required,

    };

  }

  //Check if array

  if (Array.isArray(item.type)) {

    var array = {

      type: "array",
      title: key,
      items: checkField(key, item.type[0]),

    }

    return array;

  } else if (typeof item === "object") {

    var toInsert = {

      type: "object",
      title: key,
      required: item.required,
      properties: {}

    }

    Object.keys(item).forEach(function (propertyName) {

      toInsert.properties[propertyName] = checkField(propertyName, item[propertyName])

    });

    return toInsert;

  }

};

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
