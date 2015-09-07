//Create and edit forms

var path = require('path');

C.app.get("/admin/entitytypes", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.send(Object.keys(C.dbCollections));

  } else {

    res.redirect("/admin");

  }

});

CM.admin.globals.registerMenuItem("Entities", path.join(__dirname, 'templates/entities.html'));

var upsertSchema = function (model, data, callback) {

  schema = {};

  var converters = {};

  converters["text"] = function (element) {

    var field = {};
    field.type = String;

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    return field;

  };

  converters["date"] = function (element) {

    var field = {};
    field.type = Date;

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    return field;

  };

  converters["longtext"] = function (element) {

    var field = {};
    field.type = String;
    field.long = true;

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    return field;

  };

  converters["select"] = function (element) {

    var field = {};
    field.type = String;

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    field.enum = element.options;

    return field;

  };

  converters['object'] = function (element) {

    var field = {};

    if (element.required === "true") {

      field.required = true;

    };

    if (element.label) {

      field.title = element.label;

    };

    if (element.description) {

      field.description = element.description;

    };

    if (element.subfields) {

      field.type = [{}];

      element.subfields.forEach(function (subfield, index) {

        var type = Object.keys(subfield)[1];

        if (converters[type]) {

          field.type[0][subfield[type]['system-name']] = converters[type](subfield[type]);

        }

      });

    }

    return field;

  };

  //Loop over all the fields in the fields array and convert based on type

  if (data.fields) {

    data.fields.forEach(function (element, index) {

      var type = Object.keys(element)[1];

      if (converters[type]) {

        schema[element[type]['system-name']] = converters[type](element[type]);

      }

    });

  };

  C.registerDbModel(model);
  C.registerDbSchema(model, schema);
  C.dbPopulate();

  callback();

};

C.app.post("/schema/create", function (req, res) {

  var model = req.body.entityname;

  delete req.body.entityname;

  upsertSchema(model, req.body, function () {

    res.redirect("/admin/entities");

  });

});

C.app.post("/schema/edit/:type", function (req, res) {

  var model = req.params.type;

  upsertSchema(model, req.body, function () {

    res.redirect("/admin/entities");

  });

});

//Page for creating a new schema

//Get list of fields

C.app.get("/admin/schema/fieldtypes", function (req, res) {

  var fs = require("fs");

  if (CM.admin.globals.checkAdmin(req)) {

    var coreFields = fs.readFileSync(__dirname + "/" + "corefields.json", "utf8");

    coreFields = JSON.parse(coreFields);

    res.respond(200, coreFields);

  } else {

    res.redirect("/admin");

  }

});

C.app.get("/admin/schema/create", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'templates/entity.html'));

  } else {

    res.redirect("/admin");

  }

});

//Page for editing an existing schema

C.app.get("/admin/schema/edit/:type", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'templates/entityedit.html'));

  } else {

    res.redirect("/admin");

  }

});

//Fetch existing schema

C.app.get("/admin/schema/edit/:type/form", function (req, res) {

  try {

    var fieldProcess = function (fieldname, rawfield) {

      //Ordinary strings

      if (rawfield.type === "String" && !rawfield.long && !rawfield.enum) {

        return {
          "choose": "0",
          "text": {
            "system-name": fieldname,
            "label": rawfield.title,
            "description": rawfield.description,
            "multifield": rawfield.multifield,
            "required": rawfield.required
          }
        }

      };

      //Long text field

      if (rawfield.type === "String" && rawfield.long) {

        return {
          "choose": "1",
          "longtext": {
            "system-name": fieldname,
            "label": rawfield.title,
            "description": rawfield.description,
            "multifield": rawfield.multifield,
            "required": rawfield.required,
          }
        }

      };

      //Select field

      if (rawfield.type === "String" && rawfield.enum) {

        return {
          "choose": "3",
          "select": {
            "system-name": fieldname,
            "label": rawfield.title,
            "description": rawfield.description,
            "multifield": rawfield.multifield,
            "required": rawfield.required,
            "options": rawfield.enum

          }
        }

      };

      //Date

      if (rawfield.type === "Date") {

        return {
          "choose": "2",
          "date": {
            "system-name": fieldname,
            "label": rawfield.title,
            "description": rawfield.description,
            "multifield": rawfield.multifield,
            "required": rawfield.required
          }
        }

      };

      //Boolean

      if (rawfield.type === "Boolean") {

        return {
          "choose": "4",
          "boolean": {
            "system-name": fieldname,
            "label": rawfield.title,
            "description": rawfield.description,
            "multifield": rawfield.multifield,
            "required": rawfield.required
          }
        }

      };

      //Field collections

      if (Array.isArray(rawfield.type)) {

        var subfields = [];

        Object.keys(rawfield.type[0]).forEach(function (element) {

          subfields.push(fieldProcess(element, rawfield.type[0][element]));

        });

        return {
          "choose": "5",
          "object": {
            "system-name": fieldname,
            "label": rawfield.title,
            "description": rawfield.description,
            "multifield": rawfield.multifield,
            "required": rawfield.required,
            "subfields": subfields,
          }
        }

      };

    };

    var fs = require("fs");

    var rawSchema = fs.readFileSync(C.sitePath + "/configurations/entity/" + req.params.type + ".JSON", "utf8");

    rawSchema = JSON.parse(rawSchema);

    var editSchema = [];

    Object.keys(rawSchema).forEach(function (fieldName) {

      var rawField = rawSchema[fieldName];

      editSchema.push(fieldProcess(fieldName, rawField));

    });

    res.send(editSchema);

  } catch (e) {

    res.respond(400, "No such schema");

  }
});

//Create and edit forms

C.app.get("/admin/create/:type", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'templates/create.html'));

  } else {

    res.redirect("/admin");

  }

});

C.app.get("/admin/edit/:type/:id", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'templates/edit.html'));

  } else {

    res.redirect("/admin");

  }

});

C.app.get("/admin/edit/:type/:_id/form", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

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

        if (item === "id" || item === "_id" || item === "__v" || item === "entityType") {

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

      res.send(newTree);

    }

  } else {

    res.redirect("/admin");

  }

});

C.app.get("/admin/delete/:type/:id", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'templates/delete.html'));

  } else {

    res.redirect("/admin");

  }

});


C.app.get("/admin/create/:type/form/", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    if (!C.dbCollections[req.params.type]) {

      res.respond(400, "No such type");
      return false;

    }

    var tree = C.dbCollections[req.params.type].schema.tree;

    var newTree = {
      schema: {}
    };

    Object.keys(tree).forEach(function (item) {

      if (item === "id" || item === "_id" || item === "__v" || item === "entityType") {

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

      };

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

//Entity listing screen

C.app.get("/admin/entitylist/:type", function (req, res) {

  if (req.authPass.roles.indexOf("admin") === -1) {

    res.redirect("/admin");
    return false;

  }

  if (C.dbCollections[req.params.type]) {

    //Get list of string fields

    var fields = [];

    Object.keys(C.dbCollections[req.params.type].schema.tree).forEach(function (fieldTitle) {

      var field = C.dbCollections[req.params.type].schema.tree[fieldTitle];

      if (fieldTitle !== "entityType" && field.type === String && field.long !== true) {

        fields.push(fieldTitle);

      };

    });

    var table = "<table class='table' id='entity-list'>";

    //Generate content table

    fields.forEach(function (element) {

      table += "<th>" + element + "</th>"

    });

    table += "<th>Edit</th>"

    table += "<th>Delete</th>"

    table += "<tr ng-repeat='entity in data." + req.params.type + "'>";

    fields.forEach(function (element) {

      table += "<td>{{entity." + element + "}}</td>";

    });

    table += "<td><a href='/admin/edit/" + req.params.type + "/{{entity._id}}'>Edit</a></td>";

    table += "<td><a href='/admin/delete/" + req.params.type + "/{{entity._id}}'>Delete</a></td>";

    table += "</tr>";

    table += "</table>";

    var page = fs.readFileSync(__dirname + "/" + "templates/entitylist.html", "utf8");

    page = page.split("<<entitytype>>").join(req.params.type);

    page = page.split("<<entitytable>>").join(table);

    res.send(page);

  } else {

    res.status(400);
    res.send("No such entity type");

  }

});

//CK Editor file upload

var busboy = require('connect-busboy');

C.app.use(busboy());

var fs = require('fs');

C.app.post('/admin/file/upload', function (req, res) {

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
