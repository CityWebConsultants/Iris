C.registerModule("about");

var express = require('express');

var path = require('path');

//Register static directory

C.app.use(express.static(__dirname + '/static'));

var forms = require('forms-mongoose');


C.app.get("/admin/create/:type", function (req, res) {

  res.sendFile(path.join(__dirname, 'edit.html'));

});

C.app.post("/admin/create/:type/form", function (req, res) {

  console.log(req.body);
  
});

C.app.get("/admin/create/:type/form", function (req, res) {

  if (!C.dbCollections[req.params.type]) {

    res.respond(400, "No such type");
    return false;

  }

  var tree = C.dbCollections[req.params.type].schema.tree;

  var newTree = {
    schema: {}
  };

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

      return {

        "title": item.title,
        "description": item.description,
        "type": "string",
        "required": item.required

      };

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

  Object.keys(tree).forEach(function (item) {

    if (item === "id" || item === "__v") {

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

});
