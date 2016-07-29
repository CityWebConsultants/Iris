iris.registerModule("mongodb", __dirname);

var mongoose = require('mongoose');

var dbCollections = {};

iris.modules.mongodb.registerHook("hook_db_connect__mongodb", 0, function (thisHook, data) {

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


});

// Initialise schema

iris.modules.mongodb.registerHook("hook_db_schema__mongodb", 0, function (thisHook, data) {

  var schema = thisHook.context.schema;
  var schemaConfig = thisHook.context.schemaConfig;

  /**
   * Define index for each schema including unique
   * 
   **/
  var syncSchemaIndex = function (schema) {

    // set index through the schema
    for (var i in schemaConfig) {
      if (schemaConfig[i].required == true) {
        schemaConfig[i].index = true;
      }
      if (schemaConfig[i].unique) {
        schemaConfig[i].index = {
          unique: true
        };
      }
    }

  };

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

      });

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

      });

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
    
    if (finalSchema[fieldName].maxItems) {

      var arrayLimit = function (val) {

        if (Array.isArray(val)) {

          return val.length <= finalSchema[fieldName].maxItems;

        } else {

          return true;

        }

      };

      finalSchema[fieldName].validate = [arrayLimit, '{PATH} exceeds the limit of ' + finalSchema[fieldName].maxItems];

    }

  });

  // Add universal fields
  // TODO: Need to move this to a hook or some other non-db specific system

  finalSchema.entityType = {
    type: "String",
    description: "The type of entity this is",
    title: "Entity type",
    required: true
  };

  finalSchema.entityAuthor = {
    type: "String",
    description: "The name of the author",
    title: "Author",
    required: true
  };

  finalSchema.eid = {
    type: "Number",
    description: "Entity ID",
    title: "Unique ID",
    required: false
  };

  schemaConfig = finalSchema;

  try {

    syncSchemaIndex(schema);
    var readySchema = mongoose.Schema(schemaConfig);
    readySchema.set('autoIndex', false);

    if (mongoose.models[schema]) {

      delete mongoose.models[schema];

    }

    readySchema.plugin(autoIncrement.plugin, {
      model: schema,
      field: 'eid',
      startAt: 1,
    });

    dbCollections[schema] = mongoose.model(schema, readySchema);

  } catch (e) {

    iris.log("error", e);

  }

  thisHook.pass(data);

});

iris.modules.mongodb.registerHook("hook_db_fetch__mongodb", 0, function (thisHook, data) {
  dbCollections[thisHook.context.entityType].find(thisHook.context.query).lean().sort(thisHook.context.sort).skip(thisHook.context.skip).limit(thisHook.context.limit).exec(function (err, doc) {

    data = doc;

    if (err) {

      return thisHook.fail(err);

    } else {

      thisHook.pass(data);

    }

  });

});

// Delete

iris.modules.mongodb.registerHook("hook_db_deleteEntity__mongodb", 0, function (thisHook, data) {

  dbCollections[thisHook.context.entityType].findOneAndRemove({
    eid: thisHook.context.eid
  }, function (err, pass) {

    if (err) {

      thisHook.fail(err);

    } else {

      thisHook.pass(pass);

    }

  });

});

// Create

iris.modules.mongodb.registerHook("hook_db_createEntity__mongodb", 0, function (thisHook, data) {

  var entity = new dbCollections[thisHook.context.entityType](thisHook.context.fields);

  entity.save(function (err, doc) {

    if (err) {

      thisHook.fail(err);

    } else if (doc) {

      doc = doc.toObject();

      thisHook.pass(doc);

    }

  });

});

// Update

iris.modules.mongodb.registerHook("hook_db_updateEntity__mongodb", 0, function (thisHook, data) {

  dbCollections[thisHook.context.entityType].update({
    eid: thisHook.context.eid
  }, thisHook.context.update, function (err, updated) {

    if (err) {

      thisHook.fail(err);

    } else {

      thisHook.pass(updated);

    }

  });

});

// Delete schema/collection

// Mongoose stuff here

iris.modules.mongodb.registerHook("hook_db_deleteSchema__mongodb", 0, function (thisHook, data) {

  var tableName = thisHook.context.schema;
  if (thisHook.context.schema.substr(tableName.length - 1) != "s") {
    tableName = thisHook.context.schema + "s";
  }

  mongoose.connection.db.dropCollection(tableName, function (err) {

    if (err && (err.code != 26) && err.message != "ns not found") {

      return thisHook.fail("Error deleting collection");

    }

    mongoose.connection.db.collection("identitycounters").remove({
      "model": thisHook.context.schema
    });

    delete dbCollections[thisHook.context.schema];

    thisHook.pass(data);

  });

});
