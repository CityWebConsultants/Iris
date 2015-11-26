var fs = require('fs');

//Connect to database

global.mongoose = require('mongoose');

var autoIncrement = require('mongoose-auto-increment');

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

autoIncrement.initialize(mongoose.connection);

//Wait until database is open and fail on error

mongoose.connection.on('error', function (error) {

  console.log(error);
  process.send("restart");

});

C.dbCollections = {};

C.dbSchemaJSON = {};

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

  var typeConverter = function (type) {

    switch (type) {
      case "ofstring":
        return [String];
        break;
      case "string":
        return String;
        break;
      case "number":
        return Number;
        break;
    }

    return false;

  };

  Object.keys(C.dbSchema).forEach(function (schema) {

    var parseField = function (field) {

      // Check if it's an object with subfields

      if (field.subfields) {

        var type = {};

        Object.keys(field.subfields).forEach(function (subfieldName) {

          parseField(field.subfields[subfieldName]);

          type[subfieldName] = field.subfields[subfieldName];

        });

        delete field.subfields;

        field.type = type;

      }

      // Convert types

      if (field.fieldTypeType && typeConverter(field.fieldTypeType)) {

        field.type = typeConverter(field.fieldTypeType);

      }

    }

    // Make JSON copy of complete schema

    C.dbSchemaJSON[schema] = JSON.parse(JSON.stringify(C.dbSchema[schema]));

    // Filter out universal fields

    var universalFields = ["entityType", "entityAuthor", "eId"];

    Object.keys(C.dbSchemaJSON[schema]).forEach(function (field) {

      if (universalFields.indexOf(field) !== -1) {

        delete C.dbSchemaJSON[schema][field];

      }

    })

    Object.keys(C.dbSchema[schema]).forEach(function (field) {

      parseField(C.dbSchema[schema][field]);

    });

    //Push in universal type fields if not already in.

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

      readySchema.plugin(autoIncrement.plugin, {
        model: schema,
        field: 'eId',
        startAt: 1,
      });

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
