//Connect to database

global.mongoose = require('mongoose');
var fs = require('fs');

mongoose.connect('mongodb://' + C.config.db_server + ':' + C.config.db_port + '/' + C.config.db_name);

//Wait until database is open and fail on error

mongoose.connection.on('error', function (error) {

  console.log(error);

});

//Set placeholder objects for DB models and DB schema

C.dbModels = {};
C.dbSchemaFields = {};

C.registerDbModel = function (name) {

  if (!C.dbModels[name]) {

    C.dbModels[name] = {};

  } else {

    console.log("database model already exists");

  }

};

var stringifySchema = function (field) {

  //Convert function schema types so they can be stored as JSON

  switch (field.type) {
    case String:
      field.type = "String";
      break;
    case Boolean:
      field.type = "Boolean";
      break;
    case Number:
      field.type = "Number";
      break;
    case Date:
      field.type = "Date";
      break;
    default:
      break;
  }

  //Array types

  if (Array.isArray(field.type)) {

    switch (field.type[0]) {
      case String:
        field.type = "[String]";
        break;
      case Date:
        field.type = "[Date]";
        break;
      case Number:
        field.type = "[Number]";
        break;
      case Boolean:
        field.type = "[Boolean]";
        break;
    }

  };

  //Read object fields by looping over their sub fields and running this function again.

  if (!field.type && typeof field === "object") {

    Object.keys(field).forEach(function (subField) {

      field[subField] = stringifySchema(field[subField]);

    });

  };

  //If it's an object (sigh), we have to convert all the internal properties

  if (Array.isArray(field.type)) {

    stringifySchema(field.type[0]);

  };

  return field;

};

var unstringifySchema = function (field) {

  //Convert function schema types so they can be stored as JSON

  switch (field.type) {
    case "String":
      field.type = String;
      break;
    case "Boolean":
      field.type = Boolean;
      break;
    case "Number":
      field.type = Number;
      break;
    case "Date":
      field.type = Date;
      break;
    case "[String]":
      field.type = [String];
      break;
    case "[Date]":
      field.type = [Date];
      break;
    case "[Number]":
      field.type = [Number];
      break;
    case ["Boolean"]:
      field.type = [Boolean];
      break;
    default:
      break;
  }

  //Read object fields by looping over their sub fields and running this function again.

  if (!field.type && typeof field === "object") {

    Object.keys(field).forEach(function (subField) {

      field[subField] = unstringifySchema(field[subField]);

    });

  };

  //If it's an object (sigh), we have to convert all the internal properties

  if (Array.isArray(field.type)) {

    unstringifySchema(field.type[0]);

  };

  return field;

};

C.registerDbSchema = function (model, schema) {

  if (typeof model === "string" && typeof schema === "object") {

    //Loop over provided schema fields

    Object.keys(schema).forEach(function (field) {

      stringifySchema(schema[field]);

      if (!C.dbSchemaFields[model]) {

        C.dbSchemaFields[model] = {};

      }

      C.dbSchemaFields[model][field] = schema[field];

    });


    //Add schema to config for easy export

    var mkdirSync = function (path) {
      try {
        fs.mkdirSync(path);
      } catch (e) {
        if (e.code != 'EEXIST') throw e;
      }
    }

    mkdirSync(C.sitePath + "/db");

    fs.writeFileSync(C.sitePath + "/db/" + model + ".JSON", JSON.stringify(C.dbSchemaFields[model]), "utf8");

  } else {

    console.log("invalid schema");

  }

};

C.dbCollections = {};

C.dbPopulate = function () {

  //Loop over all the db models that have been initialised and slot in any schema attached to them

  fs.readdirSync(C.sitePath + "/db").forEach(function (schemafile) {

    var model = schemafile.replace(".JSON", "");

    var schema = fs.readFileSync(C.sitePath + "/db/" + schemafile, "UTF8");

    schema = JSON.parse(schema);

    Object.keys(schema).forEach(function (thisField) {
            
      unstringifySchema(schema[thisField]);

    })

    //Push in author and entity type fields

    schema.entityType = {
      type: String,
      description: "The type of entity this is",
      title: "Entity type",
      required: true
    }

    schema.entityAuthor = {
      type: String,
      description: "The name of the author",
      title: "Author",
      required: true
    }

    var schema = mongoose.Schema(schema);

    if (mongoose.models[model]) {

      delete mongoose.models[model];

    }

    C.dbCollections[model] = mongoose.model(model, schema);

    //Create permissions for this entity type

    CM.auth.globals.registerPermission("can create " + model, "entity")
    CM.auth.globals.registerPermission("can edit any " + model, "entity")
    CM.auth.globals.registerPermission("can edit own " + model, "entity")
    CM.auth.globals.registerPermission("can view any " + model, "entity")
    CM.auth.globals.registerPermission("can view own " + model, "entity")
    CM.auth.globals.registerPermission("can delete any " + model, "entity")
    CM.auth.globals.registerPermission("can delete own " + model, "entity")

  });

};
