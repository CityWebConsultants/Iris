//Create and edit forms

var path = require('path');

C.app.get("/admin/create/:type", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'create.html'));

  } else {

    res.redirect("/admin");

  }

});

C.app.post("/schema/create", function (req, res) {

  var model = req.body.entityname;

  delete req.body.entityname;

  var form = req.body;
  var schema = {};

  var values = {};
  var currentvalue = {};
  Object.keys(req.body).forEach(function (key) {

    if (key.indexOf("system-name") !== -1) {

      values[key] = {};
      currentvalue = values[key];

    }

    currentvalue[key] = req.body[key];

  });

  var processSchema = function (item) {

    schema[values[item][item]] = {};

    var current = schema[values[item][item]];

    //Add fields that are on every type

    Object.keys(values[item]).forEach(function (subfield) {

      var type = subfield.split("_")[0].split(".")[1];

      if (type === "label") {
        current.title = values[item][subfield];
      }

      if (type === "description") {

        current.description = values[item][subfield];

      }

      if (type === "required" && values[item][subfield] === 1) {

        current.required = true;

      }

    });

    //Assign ref if a field collection field for easier lookup and switching later

    if (item.split(".")[0].indexOf("fc") !== -1) {

      current.ref = item.split(".")[0].split("fc")[0];

    };

    //Get field types

    if (item.split(".")[0] === "text" || item.split(".")[0].replace(/[0-9]/g, '') === "fctext") {

      current.type = String;

    };

    //Field collections!

    if (item.split(".")[0] === "object") {

      var fcNumber = item.split("_")[1];

      current.type = "fc";
      current.ref = fcNumber;

    };

    if (item.split(".")[0] === "longtext" || item.split(".")[0].replace(/[0-9]/g, '') === "fclongtext") {

      current.type = String;
      current.long = true;

    };

    if (item.split(".")[0] === "select" || item.split(".")[0].replace(/[0-9]/g, '') === "fcselect") {

      current.type = String;

      Object.keys(values[item]).forEach(function (subfield) {

        var type = subfield.split("_")[0].split(".")[1];

        if (type === "options") {

          current.enum = values[item][subfield][0];

        }

      });

    };


    if (item.split(".")[0] === "date" || item.split(".")[0].replace(/[0-9]/g, '') === "fcdate") {

      current.type = Date;

    };

    if (item.split(".")[0] === "boolean" || item.split(".")[0].replace(/[0-9]/g, '') === "fcboolean") {

      current.type = Boolean;

    };

  };

  //Now all the fields have been split into their fieldsets, turn them into a schema (deep breath)

  Object.keys(values).forEach(function (item) {

    processSchema(item);

  });

  //Pair up field collection items

  Object.keys(schema).forEach(function (element) {

    var item = schema[element];

    if (item.ref && item.type !== "fc") {

      var fcitem = item.ref;

      item.destroy = true;

      Object.keys(schema).forEach(function (fc) {

        if (schema[fc].ref === fcitem && schema[fc].type === "fc") {

          if (!schema[fc].fcitems) {

            schema[fc].type = [{}];

          }

          schema[fc].type[0][element] = schema[element];

        };

      });

      delete schema[element];

    };

  });

  C.registerDbModel(model);
  C.registerDbSchema(model, schema);
  C.dbPopulate();

});

C.app.get("/admin/edit/:type/:id", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'edit.html'));

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

        "title": key,
        "type": "string",
        "required": item.required,
        "enum": item.enum

      };

    } else if (item.long) {

      return {

        "title": key,
        "type": "textarea",
        "required": item.required,

      };

    } else {

      return {

        "title": key,
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
