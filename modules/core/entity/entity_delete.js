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

  if (!data.entityType || !iris.entityTypes[data.entityType]) {

    thisHook.fail(iris.error(400, "Needs to have a valid entityType"));
    return false;

  }

  //Check entity actually exists

  iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, {
    entities: [data.entityType],
    queries: [{
      field: 'eid',
      operator: 'IS',
      value: data.eid
        }]
  }).then(function (result) {

    if (result && result[0]) {

      var doc = result;

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

    iris.invokeHook("hook_db_deleteEntity__" + iris.config.dbEngine, thisHook.authPass, {
      eid: conditions.eid,
      entityType: data.entityType
    }).then(function () {

      thisHook.pass("Deleted");

      data.eid = conditions.eid;

      iris.invokeHook("hook_entity_deleted", thisHook.authPass, null, data);

    }, function (fail) {

      thisHook.fail(fail);

    })

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
 *  Remove database schema
 */
iris.modules.entity.registerHook("hook_schema_delete", 0, function (thisHook, data) {
  if (iris.modules.auth.globals.checkPermissions(["can delete schema " + data.schema], thisHook.authPass)) {

    if (!iris.entityTypes[data.schema]) {

      return thisHook.fail(iris.error(400, "Invalid schema"));

    }

    iris.invokeHook("hook_db_deleteSchema__" + iris.config.dbEngine, thisHook.authPass, {
      schema: data.schema
    }).then(function () {

      var filePath = iris.sitePath + "/configurations/entity/" + data.schema.replace("../", "") + ".json";
      fs.exists(filePath, function (exists) {

        if (exists) {

          fs.unlinkSync(filePath);

        }

        iris.dbPopulate();

      });

      return thisHook.pass(data);


    }, function (fail) {

      thisHook.fail(fail);

    })

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
