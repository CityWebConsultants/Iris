var fs = require('fs');

//Connect to database

global.mongoose = require('mongoose');

var autoIncrement = require('mongoose-auto-increment');

var fs = require('fs');

var connectionUri = 'mongodb://' + iris.config.db_server + ':' + iris.config.db_port + '/' + iris.config.db_name;

if (iris.config.db_username && iris.config.db_password) {

  mongoose.connect(connectionUri, {
    user: iris.config.db_username,
    pass: iris.config.db_password
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

iris.dbCollections = {};

iris.dbSchemaJSON = {};

iris.dbSchema = {};

var dbReady = false;

iris.dbPopulate = function () {

  // Delete any existing schema so they can be re-written

  Object.keys(iris.dbSchema).forEach(function (oldSchema) {

    delete iris.dbSchema[oldSchema];

  })

  // Loop over all enabled modules and check for schema files
  
  Object.keys(iris.modules).forEach(function (moduleName) {

    try {
      fs.readdirSync(iris.modules[moduleName].path + "/schema").forEach(function (schemafile) {

        schemafile = schemafile.toLowerCase().replace(".json", "");

        //Check if schema already exists for entity type, if not, add it

        if (!iris.dbSchema[schemafile]) {

          iris.dbSchema[schemafile] = {};

        }

        var file = JSON.parse(fs.readFileSync(iris.modules[moduleName].path + "/schema/" + schemafile + ".json"));

        Object.keys(file).forEach(function (field) {

          iris.dbSchema[schemafile][field] = file[field];

        });

      });

    } catch (e) {


    }


  });

  // See if site config has added any schema or schemafields

  fs.readdirSync(iris.sitePath + "/configurations/entity").forEach(function (schemafile) {

    var schemaName = schemafile.toLowerCase().replace(".json", "");

    var file = JSON.parse(fs.readFileSync(iris.sitePath + "/configurations/entity/" + schemafile, "UTF8"));

    if (!iris.dbSchema[schemaName]) {

      iris.dbSchema[schemaName] = {};

    }

    Object.keys(file).forEach(function (field) {

      iris.dbSchema[schemaName][field] = file[field];

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

  Object.keys(iris.dbSchema).forEach(function (schema) {

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

      iris.modules.entity2.globals.fetchSchemaForm();

      if (iris.modules.entity2.globals.fieldTypes[field.fieldTypeName] && iris.modules.entity2.globals.fieldTypes[field.fieldTypeName].fieldTypeType) {

        var fieldType = iris.modules.entity2.globals.fieldTypes[field.fieldTypeName].fieldTypeType;

      }

      if (fieldType && typeConverter(fieldType)) {

        field.type = typeConverter(fieldType);

      }

    }

    // Make JSON copy of complete schema

    iris.dbSchemaJSON[schema] = JSON.parse(JSON.stringify(iris.dbSchema[schema]));

    // Filter out universal fields

    var universalFields = ["entityType", "entityAuthor", "eid"];

    Object.keys(iris.dbSchemaJSON[schema]).forEach(function (field) {

      if (universalFields.indexOf(field) !== -1) {

        delete iris.dbSchemaJSON[schema][field];

      }

    })

    Object.keys(iris.dbSchema[schema]).forEach(function (field) {

      parseField(iris.dbSchema[schema][field]);

    });

    //Push in universal type fields if not already in.

    iris.dbSchema[schema].entityType = {
      type: String,
      description: "The type of entity this is",
      title: "Entity type",
      required: true
    }

    iris.dbSchema[schema].entityAuthor = {
      type: String,
      description: "The name of the author",
      title: "Author",
      required: true
    }

    iris.dbSchema[schema].eid = {
      type: Number,
      description: "Entity ID",
      title: "Unique ID",
      required: false
    }

    try {
      var readySchema = mongoose.Schema(iris.dbSchema[schema]);

      if (mongoose.models[schema]) {

        delete mongoose.models[schema];

      }

      readySchema.plugin(autoIncrement.plugin, {
        model: schema,
        field: 'eid',
        startAt: 1,
      });

      iris.dbCollections[schema] = mongoose.model(schema, readySchema);

    } catch (e) {

      console.log(e);

    }

    //Create permissions for this entity type

    iris.modules.auth.globals.registerPermission("can create " + schema, "entity")
    iris.modules.auth.globals.registerPermission("can edit any " + schema, "entity")
    iris.modules.auth.globals.registerPermission("can edit own " + schema, "entity")
    iris.modules.auth.globals.registerPermission("can view any " + schema, "entity")
    iris.modules.auth.globals.registerPermission("can view own " + schema, "entity")
    iris.modules.auth.globals.registerPermission("can delete any " + schema, "entity")
    iris.modules.auth.globals.registerPermission("can delete own " + schema, "entity")

  });

  if (!dbReady) {

    process.emit("dbReady", true);
    dbReady = true;

  }

};
