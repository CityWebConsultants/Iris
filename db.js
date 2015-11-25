var fs = require('fs');

//Connect to database

global.mongoose = require('mongoose');
var fs = require('fs');

var connectionUri = 'mongodb://' + C.config.db_server + ':' + C.config.db_port + '/' + C.config.db_name;

if (C.config.db_username && C.config.db_password) {

  mongoose.connect(connectionUri, {
    user: C.config.db_username,
    pass: C.config.db_password
  });

} else {

  mongoose.connect(connectionUri);

}

//Wait until database is open and fail on error

mongoose.connection.on('error', function (error) {

  console.log(error);
  process.send("restart");

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

C.stringifySchema = stringifySchema;

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

  } else {

    console.log("invalid schema");

  }

};

C.dbCollections = {};

C.dbSchema = {};

var dbReady = false;

C.dbPopulate = function () {

  // Loop over all enabled modules and check for schema files

  Object.keys(CM).forEach(function (moduleName) {

    try {
      fs.readdirSync(CM[moduleName].path + "/schema").forEach(function (schemafile) {

        schemafile = schemafile.toLowerCase().replace(".json", "");

        //Check if schema already exists for entity type, if not, add it

        if (!C.dbSchema[schemafile]) {

          C.dbSchema[schemafile] = {};

        }

        var file = JSON.parse(fs.readFileSync(CM[moduleName].path + "/schema/" + schemafile + ".json"));

        Object.keys(file).forEach(function (field) {

          C.dbSchema[schemafile][field] = file[field];

        });

      });

    } catch (e) {


    }


  });

  // See if site config has added any schema or schemafields

  fs.readdirSync(C.sitePath + "/configurations/entity").forEach(function (schemafile) {

    var schemaName = schemafile.toLowerCase().replace(".json", "");

    var file = JSON.parse(fs.readFileSync(C.sitePath + "/configurations/entity/" + schemafile, "UTF8"));

    if (!C.dbSchema[schemaName]) {

      C.dbSchema[schemaName] = {};

    }

    Object.keys(file).forEach(function (field) {

      C.dbSchema[schemaName][field] = file[field];

    });

  });

  // Schema ready, now unstringify it and save it as a database model

  Object.keys(C.dbSchema).forEach(function (schema) {

    Object.keys(C.dbSchema[schema]).forEach(function (field) {

      unstringifySchema(C.dbSchema[schema][field]);

    });

    //Push in author and entity type fields

    C.dbSchema[schema].path = {
      type: String,
      description: "Url path for this entity",
      title: "Path",
      required: false
    }

    C.dbSchema[schema].entityType = {
      type: String,
      description: "The type of entity this is",
      title: "Entity type",
      required: true
    }

    C.dbSchema[schema].entityAuthor = {
      type: String,
      description: "The name of the author",
      title: "Author",
      required: true
    }

    C.dbSchema[schema].eId = {
      type: Number,
      description: "Entity ID",
      title: "Unique ID",
      required: false
    }

    try {
      var readySchema = mongoose.Schema(C.dbSchema[schema]);


      if (mongoose.models[schema]) {

        delete mongoose.models[schema];

      }

      C.dbCollections[schema] = mongoose.model(schema, readySchema);

    } catch (e) {

      console.log(e);

    }

    //Create permissions for this entity type

    CM.auth.globals.registerPermission("can create " + schema, "entity")
    CM.auth.globals.registerPermission("can edit any " + schema, "entity")
    CM.auth.globals.registerPermission("can edit own " + schema, "entity")
    CM.auth.globals.registerPermission("can view any " + schema, "entity")
    CM.auth.globals.registerPermission("can view own " + schema, "entity")
    CM.auth.globals.registerPermission("can delete any " + schema, "entity")
    CM.auth.globals.registerPermission("can delete own " + schema, "entity")

  });

  if (!dbReady) {

    process.emit("dbReady", true);
    dbReady = true;

  }

};
