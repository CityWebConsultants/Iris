/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

/**
 * @file Manages the database connection and schemas for entity types.
 *
 * Uses Mongoose.
 */

var fs = require('fs');

//Connect to database

global.mongoose = require('mongoose');

var autoIncrement = require('mongoose-auto-increment');

var fs = require('fs');

var connectionUri = 'mongodb://' + iris.config.db_server;

if (iris.config.db_Port) {

  connectionUri += +':' + iris.config.db_port;

}

if (iris.config.db_name) {

  connectionUri += '/' + iris.config.db_name;

}

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

mongoose.connection.on('error', function(error) {

  console.log(error);
  process.send("restart");

});

iris.fieldTypes = {};

iris.dbCollections = {};

iris.dbSchemaConfig = {};

iris.dbSchema = {};

var dbReady = false;

iris.dbPopulate = function() {

  var glob = require("glob");

  var merge = require("merge");

  // Get field types

  Object.keys(iris.modules).forEach(function(moduleName) {

    var modulePath = iris.modules[moduleName].path;

    var fields = glob.sync(modulePath + "/**/*.iris.field");

    fields.forEach(function(fieldPath) {

      try {

        var field = fs.readFileSync(fieldPath, "utf8");

        field = JSON.parse(field);

        if (!iris.fieldTypes[field.name]) {

          iris.fieldTypes[field.name] = field;

        } else {

          // Merge field's properties

          var newObject = merge.recursive(true, iris.fieldTypes[field.name], field);

          iris.fieldTypes[field.name] = newObject;

        }

      } catch (e) {

        iris.log("error", e);

      }

    });


  });

  // Delete any existing schema so they can be re-written

  Object.keys(iris.dbSchema).forEach(function(oldSchema) {

    delete iris.dbSchema[oldSchema];
    delete iris.dbSchemaConfig[oldSchema];
    delete iris.dbCollections[oldSchema];
  });

  // Loop over all enabled modules and check for schema files

  Object.keys(iris.modules).forEach(function(moduleName) {

    try {
      fs.readdirSync(iris.modules[moduleName].path + "/schema").forEach(function(schemafile) {

        schemafile = schemafile.toLowerCase().replace(".json", "");

        //Check if schema already exists for entity type, if not, add it

        if (!iris.dbSchema[schemafile]) {

          iris.dbSchema[schemafile] = {};

        }

        var file = JSON.parse(fs.readFileSync(iris.modules[moduleName].path + "/schema/" + schemafile + ".json"));

        iris.dbSchema[schemafile] = merge.recursive(true, file, iris.dbSchema[schemafile]);

      });

    } catch (e) {

      // Catch errors if the file could be found (such as JSON errors)

      if (e.code !== "ENOENT") {

        iris.log("error", "Could not parse schema file in module " + moduleName);
        iris.log("error", e);

      }

    }


  });

  // See if site config has added any schema or schemafields

  fs.readdirSync(iris.sitePath + "/configurations/entity").forEach(function(schemafile) {

    var schemaName = schemafile.toLowerCase().replace(".json", "");

    var file;

    try {
      file = JSON.parse(fs.readFileSync(iris.sitePath + "/configurations/entity/" + schemafile, "UTF8"));
    } catch (e) {

      iris.log("error", schemaName + " failed db schema insertion valid JSON");
      iris.log("error", e);
      return false;

    }

    if (!iris.dbSchema[schemaName]) {

      iris.dbSchema[schemaName] = {};

    }

    Object.keys(file).forEach(function(field) {

      iris.dbSchema[schemaName][field] = file[field];

    });

  });

  // Schema ready, now unstringify it and save it as a database model

  var typeConverter = function(type) {

    switch (type) {
      case "[String]":
        return [String];
      case "String":
        return String;
      case "[Number]":
        return [Number];
      case "Number":
        return Number;
      case "[Boolean]":
        return [Boolean];
      case "Boolean":
        return Boolean;
      case "Date":
        return Date;
      case "[Date]":
        return [Date];
    }
    
     // May be a more complex field

    if (typeof type === "object") {

      var typeObject = {};

      Object.keys(type).forEach(function (key) {

        var processedtype = typeConverter(type[key]);

        if (processedtype) {

          typeObject[key] = processedtype;

        }

      })
      
      return mongoose.Schema(typeObject);
      
    } else {

      return false;

    }

    return false;

  };

  Object.keys(iris.dbSchema).forEach(function(schema) {

    // Make JSON copy of complete schema and save to non mongoosed object for reference

    var schemaConfig = JSON.parse(JSON.stringify(iris.dbSchema[schema]));

    iris.dbSchemaConfig[schema] = iris.dbSchema[schema];

    // Loop over all fields and set their type.

    var finalSchema = {};

    if (!schemaConfig.fields) {

      return false;

    }

    var fieldConverter = function(field) {

      var fieldType = field.fieldType;

      if (iris.fieldTypes[fieldType]) {

        field.type = typeConverter(iris.fieldTypes[fieldType].type);
        field.readableType = iris.fieldTypes[fieldType].type;

        return field;

      } else if (fieldType === "Fieldset") {

        // Run parent function recursively on fieldsets

        var fieldsetFields = {};

        if (field.subfields) {

          Object.keys(field.subfields).forEach(function(fieldSetField, index) {

            fieldsetFields[fieldSetField] = fieldConverter(field.subfields[fieldSetField]);

          });


          delete field.subfields;

        }

        field.readableType = "Fieldset";

        fieldsetFields._id = false;
        fieldsetFields.id = false;

        var fieldsetSchema = mongoose.Schema(fieldsetFields);

        field.type = [fieldsetSchema];

        return field;

      }

    };

    Object.keys(schemaConfig.fields).forEach(function(fieldName) {

      finalSchema[fieldName] = fieldConverter(schemaConfig.fields[fieldName]);

    });

    iris.dbSchema[schema] = finalSchema;

    var util = require("util");

    //Push in universal type fields if not already in.

    iris.dbSchema[schema].entityType = {
      type: String,
      description: "The type of entity this is",
      title: "Entity type",
      required: true
    };

    iris.dbSchema[schema].entityAuthor = {
      type: String,
      description: "The name of the author",
      title: "Author",
      required: true
    };

    iris.dbSchema[schema].eid = {
      type: Number,
      description: "Entity ID",
      title: "Unique ID",
      required: false
    };

    try {

      iris.syncSchemaIndex(schema);
      var readySchema = mongoose.Schema(iris.dbSchema[schema]);
      readySchema.set('autoIndex', false);

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

      iris.log("error", e);

    }

    //Create permissions for this entity type

    iris.modules.auth.globals.registerPermission("can create " + schema, "entity");
    iris.modules.auth.globals.registerPermission("can edit any " + schema, "entity");
    iris.modules.auth.globals.registerPermission("can edit own " + schema, "entity");
    iris.modules.auth.globals.registerPermission("can view any " + schema, "entity");
    iris.modules.auth.globals.registerPermission("can view own " + schema, "entity");
    iris.modules.auth.globals.registerPermission("can delete any " + schema, "entity");
    iris.modules.auth.globals.registerPermission("can delete own " + schema, "entity");
    iris.modules.auth.globals.registerPermission("can fetch " + schema, "entity", "Can use the API to <b>fetch</b> entities.");
    iris.modules.auth.globals.registerPermission("can delete schema " + schema, "entity", "Delete the entire schema. <strong>This includes the data</strong>.");
  });

  if (!dbReady) {

    process.emit("dbReady", true);
    dbReady = true;

  }

};

/**
 * Define index for each schema including unique
 * 
 **/
iris.syncSchemaIndex = function(schema) {

  // set index through the schema
  for (var i in iris.dbSchema[schema]) {
    if (iris.dbSchema[schema][i].required == true) {
      iris.dbSchema[schema][i].index = true;
    }
    if (iris.dbSchema[schema][i].unique) {
      iris.dbSchema[schema][i].index = { unique: true };
    }
  }

}
