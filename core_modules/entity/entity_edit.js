//Checking if a user can create an entity of a particular type and ID with a get request

C.app.get("/entity/access/edit/:type", function (req, res) {

  C.hook("hook_entity_access_edit", {
    type: req.params.type,
    _id: req.body._id
  }, req.authPass).then(function (success) {

    C.hook("hook_entity_access_edit_" + req.params.type, {
      type: req.params.type,
      _id: req.body._id
    }, req.authPass).then(function (success) {

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

//Making a post to edit an entity with an _id

C.app.post("/entity/edit/:type", function (req, res) {

  var update = function (validatedEntity) {

    var conditions = {
      _id: validatedEntity._id
    };
    var update = validatedEntity;

    C.dbCollections[req.params.type].update(conditions, update, callback);

    function callback(err, numAffected) {
      res.send("updated");
    }

  }

  //Reusable function for passing to validate

  var validate = function () {

    C.hook("hook_entity_validate", {
      type: req.params.type,
      body: req.body
    }, req.authPass).then(function (successData) {

      C.hook("hook_entity_validate_" + req.params.type, successData, req.authPass).then(function (pass) {

        update(req.body);

      }, function (fail) {

        if (fail === "No such hook exists") {

          create(req.body);

        } else {

          res.send(fail);

        }

      })

    }, function (fail) {

      res.send(fail);

    });

  };

  //Run the general, top level edit an entity access hook, passing in the _id and type

  C.hook("hook_entity_access_edit", {
    type: req.params.type,
    _id: req.body._id
  }, req.authPass).then(function (success) {

    //Run a more general access check for the particular entity type

    C.hook("hook_entity_access_edit_" + req.params.type, {
      type: req.params.type,
      _id: req.body._id
    }, req.authPass).then(function (successData) {

      validate();

    }, function (fail) {

      if (fail === "No such hook exists") {

        validate();

      } else {

        res.send(fail);

      }

    })

  }, function (fail) {

    res.send(fail);

  });

});

//Checking access and if entity type and entity exist

CM.entity.registerHook("hook_entity_access_edit", 0, function (thisHook, data) {

  if (C.dbCollections[data.type]) {

    C.dbCollections[data.type].find({
      _id: data._id
    }, function (success) {

      thisHook.finish(true, data);

    }, function (fail) {

      thisHook.finish(false, "entity doesn't exist");

    })

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, "Entity type doesn't exist");

  }

});
