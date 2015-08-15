//Making a post to edit an entity with an _id

C.app.post("/entity/edit/:type", function (req, res) {

  //Check entity and entity type actually exist

  if (C.dbCollections[req.params.type]) {

    C.dbCollections[req.params.type].findOne({
      _id: req.body._id
    }, function (err, doc) {

      if (err) {

        res.respond(500, "Database error");
        return false;

      }

      if (!doc) {

        res.respond(400, "Trying to update an entity that doesn't exist");
        return false;

      }

      if (doc) {

        runUpdate(doc);

      };

    })

  } else {

    res.respond(400, "Entity type doesn't exist");
    return false;

  }

  var runUpdate = function (doc) {

    C.hook("hook_entity_access_edit", {
      type: req.params.type,
      _id: doc._id
    }, req.authPass).then(function (success) {

      C.hook("hook_entity_access_edit_" + req.params.type, {
        type: req.params.type,
        _id: doc._id
      }, req.authPass).then(function (success) {

        validate()

      }, function (fail) {

        if (fail === "No such hook exists") {

          validate()

        } else {

          res.send(fail);

        }

      });


    }, function (fail) {

      res.send(fail);

    })

    //Reusable function for passing to validate

    var validate = function () {

      var dummyBody = JSON.parse(JSON.stringify(req.body));

      //    Object.freeze(dummyBody);

      C.hook("hook_entity_validate", {
        type: req.params.type,
        body: {
          new: dummyBody,
          old: doc
        }
      }, req.authPass).then(function (successData) {

        C.hook("hook_entity_validate_" + req.params.type, {
          new: dummyBody,
          old: doc
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

    var preSave = function () {

      //Reserved word

      req.body.entityType = req.params.type;

      C.hook("hook_entity_presave", req.body, req.authPass).then(function (successData) {

        C.hook("hook_entity_presave_" + req.params.type, req.body, req.authPass).then(function (pass) {

          update(pass);

        }, function (fail) {

          if (fail === "No such hook exists") {

            update(successData);

          } else {

            res.send(fail);

          }

        })

      }, function (fail) {

        res.send(fail);

      });

    };

    var update = function (validatedEntity) {

      var conditions = {
        _id: validatedEntity._id
      };

      delete validatedEntity._id;

      var update = validatedEntity;

      update.entityType = req.params.type;
      C.dbCollections[req.params.type].update(conditions, update, callback);

      function callback(err, numAffected) {
        res.respond(200, "updated");

        C.hook("entity_updated", req.params.type, req.authPass);

        C.hook("entity_updated_" + req.params.type, req.params.type, req.authPass);

      }

    }

  };
});

//Checking access and if entity type and entity exist

CM.entity.registerHook("hook_entity_access_edit", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

//Checking if a user can create an entity of a particular type and ID with a get request

C.app.get("/entity/access/edit/:type", function (req, res) {

  //Check entity and entity type actually exist

  if (C.dbCollections[req.params.type]) {

    C.dbCollections[req.params.type].find({
      _id: req.body._id
    }, function (err, doc) {

      if (err) {

        res.respond(500, "Database error");
        return false;

      }

      if (!doc) {

        res.respond(400, "Trying to update an entity that doesn't exist");
        return false;

      }

      if (doc) {

        runUpdate(doc);

      };

    })

  } else {

    res.respond(400, "Entity type doesn't exist");
    return false;

  }

  var runUpdate = function (doc) {

    C.hook("hook_entity_access_edit", {
      type: req.params.type,
      _id: doc._id
    }, req.authPass).then(function (success) {

      C.hook("hook_entity_access_edit_" + req.params.type, {
        type: req.params.type,
        _id: doc._id
      }, req.authPass).then(function (success) {

        validate()

      }, function (fail) {

        if (fail === "No such hook exists") {

          //Can update

        } else {

          res.send(fail);

        }

      });


    }, function (fail) {

      res.send(fail);

    })

  };

});
