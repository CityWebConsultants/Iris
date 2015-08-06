//Connect to database

global.mongoose = require('mongoose');
mongoose.connect('mongodb://' + C.config.db_server + ':' + C.config.db_port + '/' + C.config.db_name);

var db = mongoose.connection;

//Wait until database is open and fail on error

db.on('error', function (error) {

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

db.once('open', function () {

  //Loop over all the db models that have been initialised and slot in any schema attached to them

  Object.keys(C.dbModels).forEach(function (model) {

    if (C.dbSchemaFields[model]) {
      var schema = new mongoose.Schema(C.dbSchemaFields[model]);

      C.dbCollections[model] = mongoose.model(model, schema);

    } else {

      console.log("No schema fields set for this model");

    }

  });

  console.log("Database running");

});
