/**
 * @file Manages the database connection and schemas for entity types.
 *
 */


// See if a database is set in config if not, for now set it to MongoDB.

if (!iris.config.dbEngine) {

  iris.config.dbEngine = "mongodb";

}

var fs = require('fs');

//Connect to database

iris.invokeHook("hook_db_connect__" + iris.config.dbEngine, "root", iris.config, null).then(function () {

  iris.dbPopulate();

  iris.status.ready = true;

  console.log("Ready on port " + iris.config.port + ".");

  iris.log("info", "Server started");

});

iris.dbPopulate = function () {

  iris.fieldTypes = {};

  iris.entityTypes = {};

  if (iris.entityTypes) {

    Object.keys(iris.entityTypes).forEach(function (entityType) {

      delete iris.entityTypes[entityType];

    });

  }

  var dbSchema = {};

  var glob = require("glob");

  var merge = require("merge");

  // Get field types

  Object.keys(iris.modules).forEach(function (moduleName) {

    var modulePath = iris.modules[moduleName].path;

    var fields = glob.sync(modulePath + "/**/*.iris.field");

    fields.forEach(function (fieldPath) {

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

  // Loop over all enabled modules and check for schema files

  Object.keys(iris.modules).forEach(function (moduleName) {

    try {
      fs.readdirSync(iris.modules[moduleName].path + "/schema").forEach(function (schemafile) {

        schemafile = schemafile.toLowerCase().replace(".json", "");

        //Check if schema already exists for entity type, if not, add it

        if (!dbSchema[schemafile]) {

          dbSchema[schemafile] = {};

        }

        var file = JSON.parse(fs.readFileSync(iris.modules[moduleName].path + "/schema/" + schemafile + ".json"));

        dbSchema[schemafile] = merge.recursive(true, file, dbSchema[schemafile]);

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

  fs.readdirSync(iris.sitePath + "/configurations/entity").forEach(function (schemafile) {

    var schemaName = schemafile.toLowerCase().replace(".json", "");

    var file;

    try {
      file = JSON.parse(fs.readFileSync(iris.sitePath + "/configurations/entity/" + schemafile, "UTF8"));
    } catch (e) {

      iris.log("error", schemaName + " failed db schema insertion valid JSON");
      iris.log("error", e);
      return false;

    }

    if (!dbSchema[schemaName]) {

      dbSchema[schemaName] = {};

    }

    Object.keys(file).forEach(function (field) {

      dbSchema[schemaName][field] = file[field];

    });

  });

  Object.keys(dbSchema).forEach(function (schema) {

    // Make JSON copy of complete schema and save to non mongoosed object for reference

    iris.entityTypes[schema] = JSON.parse(JSON.stringify(dbSchema[schema]));

    // Sneaky shortcut way of saving of fieldtypes into the entityType list

    var stringySchema = JSON.stringify(iris.entityTypes[schema]);

    Object.keys(iris.fieldTypes).forEach(function (fieldType) {

      try {

        fieldType = iris.fieldTypes[fieldType];
        var name = fieldType.name;
        var type = fieldType.type;

        var search = `"fieldType":"${name}",`;
        var replace = search + `"fieldTypeType":"${type}",`;

        stringySchema = stringySchema.split(search).join(replace);

      } catch (e) {

        iris.log("error", e);

      }

    });

    iris.entityTypes[schema] = JSON.parse(stringySchema);

  });

  var schemaCounter = 0;
  var schemaLoaded = function () {

    schemaCounter += 1;
    if (schemaCounter === Object.keys(iris.entityTypes).length) {

      process.emit("dbReady", true);

    }

  };

  Object.keys(iris.entityTypes).forEach(function (entityType) {

    if (!iris.entityTypes[entityType].fields) {

      iris.entityTypes[entityType].fields = {};

    }

    iris.entityTypes[entityType].fields.path = {
      fieldType: 'Textfield',
      fieldTypeType: 'String',
      label: 'path',
      fixed: true, // A fixed field isn't shown on the schema edit page as it can't be edited/deleted 
      weight: 1111, // JSON doesn't support infinity - ugh
      machineName: 'path'
    };

    iris.invokeHook("hook_db_schema__" + iris.config.dbEngine, "root", {
      schema: entityType,
      schemaConfig: JSON.parse(JSON.stringify(iris.entityTypes[entityType]))
    }).then(function () {

      //Create permissions for this entity type

      iris.modules.auth.globals.registerPermission("can create " + entityType, "entity");
      iris.modules.auth.globals.registerPermission("can edit any " + entityType, "entity");
      iris.modules.auth.globals.registerPermission("can edit own " + entityType, "entity");
      iris.modules.auth.globals.registerPermission("can view any " + entityType, "entity");
      iris.modules.auth.globals.registerPermission("can view own " + entityType, "entity");
      iris.modules.auth.globals.registerPermission("can delete any " + entityType, "entity");
      iris.modules.auth.globals.registerPermission("can delete own " + entityType, "entity");
      iris.modules.auth.globals.registerPermission("can fetch " + entityType, "entity", "Can use the API to <b>fetch</b> entities.");
      iris.modules.auth.globals.registerPermission("can delete schema " + entityType, "entity", "Delete the entire schema. <strong>This includes the data</strong>.");

      schemaLoaded();

    });

  });

};

/**
 * Function for registering a DB schema directly in code
 * isContent boolean variable determines whether the entity type appears on a content page 
 */

iris.dbSchemaRegister = function (name, fields, isContent = false) {

  return new Promise(function (resolve, reject) {

    var schema = {
      entityTypeName: name,
      fields: fields
    };

    Object.defineProperty(iris.entityTypes, name, {
      enumerable: isContent,
      writable: true,
      configurable: true,
      value: schema
    });

    iris.invokeHook("hook_db_schema__" + iris.config.dbEngine, "root", {
      schema: name,
      schemaConfig: JSON.parse(JSON.stringify(schema))
    }).then(function () {

      resolve();

    }, function (fail) {

      reject(fail);

    });

  });

};
