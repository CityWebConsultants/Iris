//Create and edit forms

var path = require('path');

C.app.get("/admin/create/:type", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'create.html'));

  } else {

    res.redirect("/admin");

  }

});

C.app.post("/schema/create/:model", function (req, res) {

  var model = req.params.model;
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

  //Now all the fields have been split into their fieldsets, turn them into a schema (deep breath)

  Object.keys(values).forEach(function (item) {

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

    //Get field type

    if (item.split(".")[0] === "text") {

      current.type = String;

    };

    if (item.split(".")[0] === "longtext") {

      current.type = String;
      current.long = true;

    };

    if (item.split(".")[0] === "select") {

      current.type = String;

      Object.keys(values[item]).forEach(function (subfield) {

        var type = subfield.split("_")[0].split(".")[1];

        if (type === "options") {

          current.enum = values[item][subfield][0];

        }

      });

    };

    if (item.split(".")[0] === "date") {

      current.type = Date;

    };

    if (item.split(".")[0] === "boolean") {

      current.type = Boolean;

    };

  });

  C.registerDbModel(model);
  C.registerDbSchema(model, schema);
  C.dbPopulate();

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

      if (item === "id" || item === "__v" || item === "entityType") {

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

    res.respond(403, "Access denied");

  }

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

        if (item === "id" || item === "__v" || item === "entityType") {

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

      if (item === "id" || item === "__v" || item === "entityType") {

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

  //If doesn't have a type set, must be array or object 

  if (!type) {

    //Check if array

    if (Array.isArray(item)) {

      var array = {

        type: "array",
        title: key,
        items: checkField(key, item[0]),

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

  }

};
