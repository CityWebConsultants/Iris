//Checking if a user can create an entity of a particular type

C.app.get("/entity/access/create/:type", function (req, res) {

  C.hook("hook_entity_access_create", req.params.type, req.authPass).then(function (success) {

    C.hook("hook_entity_access_create_" + req.params.type, req.params.type, req.authPass).then(function (success) {

      res.send(success);

    }, function (fail) {

      if (fail === "No such hook exists") {

        res.send(success);

      } else {

        res.send(fail);

      }

    })

  }, function (fail) {

    console.log(fail);
    res.send(fail);

  });

});

CM.entity.registerHook("hook_entity_presave", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

C.app.post("/entity/create/:type", function (req, res) {

  if (req.body._id) {

    res.respond(400, "Can't send an ID or current entity when creating an entity. Try update");
    return false;

  };
  
  //Set author and entity type
  
  req.body.entityType = req.params.type;
  req.body.entityAuthor = req.authPass.userid; 

  var create = function (preparedEntity) {

    var entity = new C.dbCollections[req.params.type](preparedEntity);

    entity.save(function (err, doc) {

      if (err) {

        console.log(err);
        res.send("Database error");

      } else if (doc) {

        res.send(doc);

        C.hook("entity_created", doc, req.authPass);

        C.hook("entity_created_" + req.params.type, doc, req.authPass);

      }

    });

  }

  var preSave = function (entity) {

    C.hook("hook_entity_presave", {
      type: req.params.type,
      body: entity
    }, req.authPass).then(function (successData) {

      C.hook("hook_entity_presave_" + req.params.type, entity, req.authPass).then(function (pass) {

        create(successData.body);

      }, function (fail) {

        if (fail === "No such hook exists") {

          create(successData.body);

        } else {

          res.send(fail);

        }

      })

    }, function (fail) {

      res.send(fail);

    });

  };

  //Reusable function for passing to validate

  var validate = function () {

    var dummyBody = JSON.parse(JSON.stringify(req.body));

    //    Object.freeze(dummyBody);

    C.hook("hook_entity_validate", {
      type: req.params.type,
      body: {
        new: dummyBody,
        old: null
      }
    }, req.authPass).then(function (successData) {

      C.hook("hook_entity_validate_" + req.params.type, {
        new: dummyBody,
        old: null
      }, req.authPass).then(function (pass) {

        preSave(req.body);

      }, function (fail) {

        if (fail === "No such hook exists") {

          preSave(req.body);

        } else {

          res.send(fail);

        }

      })

    }, function (fail) {

      res.send(fail);

    });

  };

  C.hook("hook_entity_access_create", req.params.type, req.authPass).then(function (success) {

    C.hook("hook_entity_access_create_" + req.params.type, req.params.type, req.authPass).then(function (successData) {

      validate(successData);

    }, function (fail) {

      if (fail === "No such hook exists") {

        validate(success);

      } else {

        res.send(fail);

      }

    })

  }, function (fail) {

    res.send(fail);

  });

});

CM.entity.registerHook("hook_entity_validate", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

//Checking access and if entity exists

CM.entity.registerHook("hook_entity_access_create", 0, function (thisHook, entityType) {

  if (C.dbCollections[entityType]) {

    thisHook.finish(true, entityType);

  } else {

    thisHook.finish(false, "Entity type doesn't exist");

  }

});
