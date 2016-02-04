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

    thisHook.finish(false, iris.error(400, "Have to have an ID to delete something"));
    return false;

  };

  if (!data.entityType || !iris.dbCollections[data.entityType]) {

    thisHook.finish(false, iris.error(400, "Needs to have a valid entityType"));
    return false;

  }

  //Check entity actually exists

  iris.dbCollections[data.entityType].findOne({
    eid: data.eid
  }, function (err, doc) {

    if (err) {

      thisHook.finish(false, iris.error(500, "Database error"));
      return false;

    }

    if (!doc) {

      thisHook.finish(false, iris.error(400, "Trying to delete an entity which doesn't exist"));
      return false;

    }

    if (doc) {
      
      data.entityAuthor = doc.entityAuthor;

      runDelete(data);

    };

  })

  //Actual run update function

  var runDelete = function () {

    iris.hook("hook_entity_access_delete", thisHook.authPass, null, data).then(function (success) {

      iris.hook("hook_entity_access_delete_" + data.entityType, thisHook.authPass, null, data).then(function (success) {

        deleteEntity(data)

      }, function (fail) {

        if (fail === "No such hook exists") {

          deleteEntity(data)

        } else {

          thisHook.finish(false, fail);

        }

      });


    }, function (fail) {

      thisHook.finish(false, fail);

    })

  }

  var deleteEntity = function (validatedEntity) {

    var conditions = {
      eid: validatedEntity.eid
    };

    delete validatedEntity.eid;

    var update = validatedEntity;

    update.entityType = data.entityType;

    iris.dbCollections[data.entityType].findOneAndRemove(conditions, update, callback);

    function callback(err, numAffected) {

      thisHook.finish(true, "Deleted");

      data.eid = conditions.eid;

      iris.hook("hook_entity_deleted", thisHook.authPass, null, data)

      iris.log("info", data.entityType + " " + conditions.eid + " deleted by " + thisHook.authPass.userid);

    }

  }

});

iris.app.post("/entity/delete/:type/:eid", function (req, res) {

  req.body.entityType = req.params.type;
  req.body.eid = req.params.eid;

  iris.hook("hook_entity_delete", req.authPass, null, req.body).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.send(fail);

  });

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

      thisHook.finish(false, "Access denied");
      return false;

    } else {

      if (data.entityAuthor !== thisHook.authPass.userid) {

        thisHook.finish(false, "Access denied");
        return false;

      }

    }

  }

  thisHook.finish(true, data);

});
