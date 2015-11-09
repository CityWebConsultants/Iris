//Checking if a user can create an entity of a particular type


CM.entity.registerHook("hook_entity_create", 0, function (thisHook, data) {

  //Not allowed to send _id when creating as it is set automatically

  if (data._id) {

    thisHook.finish(false, C.error(400, "Can't send an ID or current entity when creating an entity. Try update"));
    return false;

  };

  //Set author and entity type

  if (!data.entityType || !C.dbCollections[data.entityType]) {

    thisHook.finish(false, C.error(400, "Needs to have a valid entityType"));
    return false;

  }

  //Set author if not set already

  if (!data.entityAuthor) {

    data.entityAuthor = thisHook.authPass.userid;

  }

  //Check if user has access to create entities

  C.hook("hook_entity_access_create", thisHook.authPass, null, data).then(function (success) {

    C.hook("hook_entity_access_create_" + data.entityType, thisHook.authPass, null, data).then(function (successData) {

      validate(data);

    }, function (fail) {

      if (fail === "No such hook exists") {

        validate(data);

      } else {

        thisHook.finish(false, C.error(403, "Access denied"));
        return false;

      }

    })

  }, function (fail) {

    thisHook.finish(false, C.error(403, "Access denied"));
    return false;

  });

  //Validate function before passing to presave

  var validate = function (data) {

    //Create dummy body so it can't be edited during validation

    var dummyBody = JSON.parse(JSON.stringify(data));

    //    Object.freeze(dummyBody);

    C.hook("hook_entity_validate", thisHook.authPass, null, dummyBody).then(function (successData) {

      C.hook("hook_entity_validate_" + data.entityType, thisHook.authPass, null, dummyBody).then(function (pass) {

        preSave(data);

      }, function (fail) {

        if (fail === "No such hook exists") {

          preSave(data);

        } else {

          thisHook.finish(false, fail);
          return false;

        }

      })

    }, function (fail) {

      thisHook.finish(false, fail);
      return false;

    });

  };

  //Presave function

  var preSave = function (entity) {

    C.hook("hook_entity_presave", thisHook.authPass, null, entity).then(function (successData) {

      C.hook("hook_entity_presave_" + data.entityType, thisHook.authPass, null, entity).then(function (pass) {

        create(successData);

      }, function (fail) {

        if (fail === "No such hook exists") {

          create(successData);

        } else {

          thisHook.finish(false, fail);
          return false;

        }

      })

    }, function (fail) {

      thisHook.finish(false, fail);
      return false;

    });

  };

  //Create function and related hooks

  var create = function (preparedEntity) {

    var entity = new C.dbCollections[preparedEntity.entityType](preparedEntity);

    entity.save(function (err, doc) {

      if (err) {

        console.log(err);
        thisHook.finish(false, "Database error");

      } else if (doc) {
        
        doc = doc.toObject();

        thisHook.finish(true, doc);

        C.hook("hook_entity_created", thisHook.authPass, null, doc);

        C.hook("hook_entity_created_" + data.entityType, thisHook.authPass, null, doc);
        
        C.log("info", data.entityType + " created by " + doc.entityAuthor);

      }

    });

  }

});

C.app.post("/entity/create/:type", function (req, res) {

  req.body.entityType = req.params.type;

  C.hook("hook_entity_create", req.authPass, null, req.body).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

CM.entity.registerHook("hook_entity_validate", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

//Checking access and if entity exists

CM.entity.registerHook("hook_entity_access_create", 0, function (thisHook, data) {

  if (!CM.auth.globals.checkPermissions(["can create " + data.entityType], thisHook.authPass)) {

    thisHook.finish(false, "Access denied");
    return false;

  }

  thisHook.finish(true, data);

});

CM.entity.registerHook("hook_entity_presave", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});
