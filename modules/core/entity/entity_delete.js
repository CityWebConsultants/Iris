/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise*/

var fs = require('fs');

/**
 * @file Functions and hooks for managing deletion of entities
 */

/**
 * @member hook_entity_delete
 * @memberof entity
 *
 * @desc Entity deletion hook
 *
 * Deletes an entity from the database, and any other stores.
 *
 * Hook variables must include an entity ID (eid) and entity type.
 */
iris.modules.entity.registerHook("hook_entity_delete", 0, function (thisHook, data) {

  // Check for supplied ID and type

  if (!data.eid) {

    thisHook.fail(iris.error(400, "Have to have an ID to delete something"));
    return false;

  }

  if (!data.entityType || !iris.dbCollections[data.entityType]) {

    thisHook.fail(iris.error(400, "Needs to have a valid entityType"));
    return false;

  }

  //Check entity actually exists

  iris.dbCollections[data.entityType].findOne({
    eid: data.eid
  }, function (err, doc) {

    if (err) {

      thisHook.fail(iris.error(500, "Database error"));
      return false;

    }

    if (!doc) {

      thisHook.fail(iris.error(400, "Trying to delete an entity which doesn't exist"));
      return false;

    }

    if (doc) {
      
      data.entityAuthor = doc.entityAuthor;

      runDelete(data);

    }

  });

  //Actual run update function

  var runDelete = function () {

    iris.invokeHook("hook_entity_access_delete", thisHook.authPass, null, data).then(function (success) {

      iris.invokeHook("hook_entity_access_delete_" + data.entityType, thisHook.authPass, null, data).then(function (success) {

        deleteEntity(data);

      }, function (fail) {

        if (fail === "No such hook exists") {

          deleteEntity(data);

        } else {

          thisHook.fail(fail);

        }

      });


    }, function (fail) {

      thisHook.fail(fail);

    });

  };

  var deleteEntity = function (validatedEntity) {

    var conditions = {
      eid: validatedEntity.eid
    };

    delete validatedEntity.eid;

    var update = validatedEntity;

    update.entityType = data.entityType;

    iris.dbCollections[data.entityType].findOneAndRemove(conditions, update, callback);

    function callback(err, numAffected) {

      thisHook.pass("Deleted");

      data.eid = conditions.eid;

      iris.invokeHook("hook_entity_deleted", thisHook.authPass, null, data);

      iris.log("info", data.entityType + " " + conditions.eid + " deleted by " + thisHook.authPass.userid);

    }

  };

});

iris.app.post("/entity/delete/:type/:eid", function (req, res) {

  req.body.entityType = req.params.type;
  req.body.eid = req.params.eid;

  iris.invokeHook("hook_entity_delete", req.authPass, null, req.body).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.json(fail);

  });

});


/*
*  Things to remove...
*  1. Database table
*  2. identitycounters index
*  3. iris.dbCollections[schema]
*  4. configurations/entity/{{schema.json}}
*
 */
iris.modules.entity.registerHook("hook_schema_delete", 0, function (thisHook, data) {
  if (iris.modules.auth.globals.checkPermissions(["can delete schema " + data.schema], thisHook.authPass)) {

    if(!iris.dbCollections[data.schema]) return thisHook.fail(iris.error(400, "Invalid schema"));

    var mongoose = require('mongoose');

    // 1.
    var tableName = data.schema;
    if(data.schema.substr(tableName.length - 1) != "s"){
      tableName = data.schema + "s";
    }

    mongoose.connection.db.dropCollection(tableName, function(err){
      // 26 - ns not found, collection may not exist in database
      if(err && (err.code != 26)) return thisHook.fail("Error deleting collection");


      // 2.
      mongoose.connection.db.collection("identitycounters").remove({"model": data.schema});

      // 3.
      delete iris.dbCollections[data.schema];

      // 4.
      var filePath = iris.sitePath + "/configurations/entity/" + data.schema.replace("../", "") + ".json";
      fs.exists(filePath, function(exists) {

        if(exists)
          fs.unlinkSync(filePath);

        iris.dbPopulate();
      });

      return thisHook.pass(data);

    });

  } else {
    thisHook.fail(400);
  }
});


/**
 * @member hook_entity_access_delete
 * @memberof entity
 *
 * @desc Checks permission for deleting an entity
 *
 * This hook returns successfully only if the authPass allows for the entity provided to be created.
 */
iris.modules.entity.registerHook("hook_entity_access_delete", 0, function (thisHook, data) {

  if (!iris.modules.auth.globals.checkPermissions(["can delete any " + data.entityType], thisHook.authPass)) {

    if (!iris.modules.auth.globals.checkPermissions(["can delete own " + data.entityType], thisHook.authPass)) {

      thisHook.fail("Access denied");
      return false;

    } else {

      if (data.entityAuthor !== thisHook.authPass.userid) {

        thisHook.fail("Access denied");
        return false;

      }

    }

  }

  thisHook.pass(data);

});
