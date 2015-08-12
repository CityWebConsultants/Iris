//Connect to database

global.mongoose = require('mongoose');

mongoose.connect('mongodb://' + C.config.db_server + ':' + C.config.db_port + '/' + C.config.db_name);

//Wait until database is open and fail on error

mongoose.connection.on('error', function (error) {

  console.log(error);

});

//Set placeholder objects for DB models and DB schema

var dbModels = {};
var dbSchemaFields = {};

C.registerDbModel = function (name) {

  if (!dbModels[name]) {

    dbModels[name] = {};

  } else {

    console.log("database model already exists");

  }

};

C.registerDbSchema = function (model, schema) {

  if (typeof model === "string" && typeof schema === "object") {

    //Loop over provided schema fields

    Object.keys(schema).forEach(function (field) {

      if (!dbSchemaFields[model]) {

        dbSchemaFields[model] = {};

      }

      dbSchemaFields[model][field] = schema[field];

    });

  } else {

    console.log("invalid schema");

  }

};

C.dbCollections = {};

C.dbPopulate = function () {

  //Loop over all the db models that have been initialised and slot in any schema attached to them

  Object.keys(dbModels).forEach(function (model) {

    if (dbSchemaFields[model]) {
      var schema = new mongoose.Schema(dbSchemaFields[model]);

      C.dbCollections[model] = mongoose.model(model, schema);

    } else {

      console.log("No schema fields set for this model");

    }

  });

  console.log("Database running");

};
