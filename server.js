/*jslint nomen: true, node:true */
"use strict";

var version = "RC1";

module.exports = function (config, paramaters, roles) {

  //Get any config paramaters passed through via the command line and set them.

  if (Object.keys(paramaters).length > 0) {
    console.log("Command line arguments: ");
    console.log(paramaters);

    Object.keys(paramaters).forEach(function (paramater) {

      config[paramater] = paramaters[paramater];

    })

  }

  //Create global object for the application

  global.C = {};

  //Store config object for global use (this has now been updated with the additional paramaters.

  C.config = config;

  //Store the roles and permissions object from the lanched site

  C.roles = roles;

  //Load required modules

  var http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser');

  console.log("\nLaunching Chat App " + version + "\n");
  console.log("Name: " + config.name);
  console.log("Hypertext port: " + config.port);

  //Hook system

  C.hook = require('./hook');

  //Promisechains

  C.promiseChain = function (tasks, parameters, success, fail) {

    tasks.reduce(function (cur, next) {
      return cur.then(next);
    }, Promise.resolve(parameters)).then(success, fail);

  };

  //Connect to database

  global.mongoose = require('mongoose');
  mongoose.connect('mongodb://' + config.db_server + ':' + config.db_port + '/' + config.db_name);

  var db = mongoose.connection;

  //Wait until database is open and fail on error

  db.on('error', function (error) {

    console.log(error);

  });

  //Check database is loaded

  db.once('open', function () {

    console.log("Database running");

    //Set up express HTTP server

    C.app = express();

    //Set up bodyParser

    C.app.use(bodyParser.json());

    C.app.use(bodyParser.urlencoded({
      extended: true
    }));

    //Set up CORS

    C.app.use(function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

    C.app.use(function (req, res, next) {

      Object.keys(req.body).forEach(function (element) {

        try {

          req.body[element] = JSON.parse(req.body[element]);

        } catch (e) {

          console.log("Not JSON stringified");

        }

      });

      var authCredentials = {

        userid: req.body.userid,
        token: req.body.token,
        secretkey: req.body.secretkey,
        apikey: req.body.apikey

      }
      
      C.auth.credentialsToPass(authCredentials).then(function (authPass) {

        req.authPass = authPass;
        next();

      }, function (error) {

        res.end(JSON.stringify(error));

      });

    });

    //Authentication module

    C.auth = require('./core_modules/auth').globals;

    //Server and request function router

    if (config.https) {

      var https = require('https');

      var tls_options = {
        key: fs.readFileSync(config.https_key),
        cert: fs.readFileSync(config.https_cert)
      };

      C.server = https.createServer(tls_options, C.app);

      C.server.listen(process.config.port);

    } else {

      C.server = http.createServer(C.app);

      C.server.listen(config.port);

    }

    //Load all additional modules and related database schema

    console.log("\nEnabled modules:\n");

    var dbModels = {};
    var dbSchema = {};



    // Automatically load modules
    config.modules_enabled.forEach(function (element, index) {

      var thisModule = require('./chat_modules/' + element.name);

      if (thisModule.init) {

        thisModule.init();

      }

      //Add and namespace global functions

      if (thisModule.globals) {

        C[element.name] = {};

        var globals = thisModule.globals;

        Object.keys(globals).forEach(function (global) {
          C[element.name][global] = globals[global];
        });

      }

      //Initialise dbModels if any set in module

      if (thisModule.dbModels) {

        var models = thisModule.dbModels;

        Object.keys(models).forEach(function (model) {

          dbModels[model] = {
            options: models[model],
            moduleName: element.name,
            model: {}
          };

        });

      }

      if (thisModule.dbSchemaFields) {

        var schemaSets = thisModule.dbSchemaFields;

        Object.keys(schemaSets).forEach(function (model) {

          if (dbModels[model]) {

            //dbModel exists

            var schemaFields = schemaSets[model];

            Object.keys(schemaFields).forEach(function (field) {

              //Add or overwrite a field in a schema model

              dbModels[model].model[field] = schemaFields[field];

            })

          } else {

            console.log(model + " is not a valid dbModel");

          }

        });

      }

      console.log(element.name);

    });

    //Great store for global database models 

    C.dbModels = {};

    //Create dbModels

    Object.keys(dbModels).forEach(function (model) {

      var schema = new mongoose.Schema(dbModels[model].model);

      if (!C.dbModels[dbModels[model].moduleName]) {

        C.dbModels[dbModels[model].moduleName] = {};

      }

      C.dbModels[dbModels[model].moduleName][model] = mongoose.model(model, schema);

    });

  });

};
