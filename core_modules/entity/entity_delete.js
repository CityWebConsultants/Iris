//Making a post to delete an entity with an _id


CM.entity.registerHook("hook_entity_delete", 0, function (thisHook, data) {

  // Check for supplied ID and type

  if (!data._id) {

    thisHook.finish(false, C.error(400, "Have to have an ID to delete something"));
    return false;

  };

  if (!data.entityType || !C.dbCollections[data.entityType]) {

    thisHook.finish(false, C.error(400, "Needs to have a valid entityType"));
    return false;

  }

  //Check entity actually exists

  C.dbCollections[data.entityType].findOne({
    _id: data._id
  }, function (err, doc) {

    if (err) {

      thisHook.finish(false, C.error(500, "Database error"));
      return false;

    }

    if (!doc) {

      thisHook.finish(false, C.error(400, "Trying to delete an entity which doesn't exist"));
      return false;

    }

    if (doc) {

      runDelete(data);

    };

  })

  //Actual run update function

  var runDelete = function () {

    C.hook("hook_entity_access_delete", thisHook.authPass, null, data).then(function (success) {

      C.hook("hook_entity_access_delete_" + data.entityType, thisHook.authPass, null, data).then(function (success) {

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
      _id: validatedEntity._id
    };

    delete validatedEntity._id;

    var update = validatedEntity;

    update.entityType = data.entityType;

    C.dbCollections[data.entityType].findOneAndRemove(conditions, update, callback);

    function callback(err, numAffected) {

      thisHook.finish(true, "Deleted");

      data._id = conditions._id;

      C.hook("hook_entity_deleted", thisHook.authPass, null, data)

      C.log("info", data.entityType + " " + conditions._id + " deleted by " + validatedEntity.entityAuthor);

    }

  }

});

C.app.post("/entity/delete/:type/:_id", function (req, res) {

  req.body.entityType = req.params.type;
  req.body._id = req.params._id;

  C.hook("hook_entity_delete", req.authPass, null, req.body).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.send(fail);

  });

});

//Checking access and if entity type and entity exist

CM.entity.registerHook("hook_entity_access_delete", 0, function (thisHook, data) {

  if (!CM.auth.globals.checkPermissions(["can delete any " + data.entityType], thisHook.authPass)) {

    if (!CM.auth.globals.checkPermissions(["can delete own " + data.entityType], thisHook.authPass)) {

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
