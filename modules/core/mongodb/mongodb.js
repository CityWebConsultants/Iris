iris.registerModule("mongodb", __dirname);

iris.modules.system.registerHook("hook_db_connect", 0, function (thisHook, data) {

  global.mongoose = require('mongoose');

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

  //Wait until database is open and fail on error

  mongoose.connection.on('error', function (error) {

    process.send("restart");

    thisHook.fail(error);

  });

  mongoose.connection.once("open", function () {

    thisHook.pass(data);

  });


})

// Initialise schema

iris.modules.system.registerHook("hook_db_schema", 0, function (thisHook, data) {

  var schema = thisHook.context.schema;
  var schemaConfig = thisHook.context.schemaConfig;

  /**
   * Define index for each schema including unique
   * 
   **/
  var syncSchemaIndex = function (schema) {

    // set index through the schema
    for (var i in iris.dbSchema[schema]) {
      if (iris.dbSchema[schema][i].required == true) {
        iris.dbSchema[schema][i].index = true;
      }
      if (iris.dbSchema[schema][i].unique) {
        iris.dbSchema[schema][i].index = {
          unique: true
        };
      }
    }

  }

  var autoIncrement = require('mongoose-auto-increment');

  autoIncrement.initialize(mongoose.connection);

  // Schema ready, now unstringify it and save it as a database model

  var typeConverter = function (type) {

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

    // May be an array of more complex field

    if (Array.isArray(type) && (typeof type[0] === "object")) {

      var typeObject = {};

      Object.keys(type[0]).forEach(function (key) {

        var processedtype = typeConverter(type[0][key]);

        if (processedtype) {

          typeObject[key] = processedtype;

        }

      })

      return [mongoose.Schema(typeObject, {
        "_id": false
      })];

    }
    // May be a more complex field
    else if (typeof type === "object") {

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


  // Loop over all fields and set their type.

  var finalSchema = {};

  if (!schemaConfig.fields) {

    return false;

  }

  var fieldConverter = function (field) {

    var fieldType = field.fieldType;

    if (iris.fieldTypes[fieldType]) {

      field.type = typeConverter(iris.fieldTypes[fieldType].type);
      field.readableType = iris.fieldTypes[fieldType].type;

      return field;

    } else if (fieldType === "Fieldset") {

      // Run parent function recursively on fieldsets

      var fieldsetFields = {};

      if (field.subfields) {

        Object.keys(field.subfields).forEach(function (fieldSetField, index) {

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

  Object.keys(schemaConfig.fields).forEach(function (fieldName) {

    finalSchema[fieldName] = fieldConverter(schemaConfig.fields[fieldName]);

  });

  iris.dbSchema[schema] = finalSchema;

  try {

    syncSchemaIndex(schema);
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

  thisHook.pass(data);

})
