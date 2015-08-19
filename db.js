//Connect to database

global.mongoose = require('mongoose');

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

C.registerDbSchema = function (model, schema) {

  if (typeof model === "string" && typeof schema === "object") {

    //Loop over provided schema fields

    Object.keys(schema).forEach(function (field) {

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

C.dbPopulate = function () {

  //Loop over all the db models that have been initialised and slot in any schema attached to them

  Object.keys(C.dbModels).forEach(function (model) {

    if (C.dbSchemaFields[model]) {

      //Push in author and entity type fields

      C.dbSchemaFields[model].entityType = {
        type: String,
        description: "The type of entity this is",
        title: "Entity type",
        required: true
      }

      C.dbSchemaFields[model].entityAuthor = {
        type: String,
        description: "The name of the author",
        title: "Author",
        required: true
      }

      var schema = new mongoose.Schema(C.dbSchemaFields[model]);

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

    } else {

      console.log("No schema fields set for this model");

    }

  });

};
