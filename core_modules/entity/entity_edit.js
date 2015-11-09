//Making a post to edit an entity with an _id


CM.entity.registerHook("hook_entity_edit", 0, function (thisHook, data) {

  if (!data._id) {

    thisHook.finish(false, C.error(400, "Have to have an ID to edit something"));
    return false;

  };

  //Set entity type

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

      thisHook.finish(false, C.error(400, "Trying to update an entity which doesn't exist"));
      return false;

    }

    if (doc) {

      runUpdate(data);

    };

  })

  //Actual run update function

  var runUpdate = function () {

    C.hook("hook_entity_access_edit", thisHook.authPass, null, data).then(function (success) {

      C.hook("hook_entity_access_edit_" + data.entityType, thisHook.authPass, null, data).then(function (success) {

        validate()

      }, function (fail) {

        if (fail === "No such hook exists") {

          validate()

        } else {

          thisHook.finish(false, fail);

        }

      });


    }, function (fail) {

      thisHook.finish(false, fail);

    })

  }

  //Validate function before passing to presave

  var validate = function () {

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

  var preSave = function () {

    C.hook("hook_entity_presave", thisHook.authPass, null, data).then(function (successData) {

      C.hook("hook_entity_presave_" + data.entityType, thisHook.authPass, null, data).then(function (pass) {

        update(pass);

      }, function (fail) {

        if (fail === "No such hook exists") {

          update(successData);

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

  var update = function (validatedEntity) {

    var conditions = {
      _id: validatedEntity._id
    };

    delete validatedEntity._id;

    var update = validatedEntity;

    update.entityType = data.entityType;
    C.dbCollections[data.entityType].update(conditions, update, callback);

    function callback(err, numAffected) {

      thisHook.finish(true, "Updated");

      data._id = conditions._id;

      C.hook("hook_entity_updated", thisHook.authPass, null, data)

      C.log("info", data.entityType + " " + conditions._id + " edited by " + validatedEntity.entityAuthor);

    }

  }

});

C.app.post("/entity/edit/:type/:_id", function (req, res) {

//  var busboy = require('connect-busboy');
//
//  C.app.use(busboy());
//
//  var fs = require('fs');
//
//  var fstream;
//  req.pipe(req.busboy);
//  req.busboy.on('file', function (fieldname, file, filename) {
//    fstream = fs.createWriteStream(C.sitePath + '/files/' + filename);
//    file.pipe(fstream);
//    fstream.on('close', function () {
//
//      console.log("filesaved");
//
//    });
//  });

  req.body.entityType = req.params.type;
  req.body._id = req.params._id;

  C.hook("hook_entity_edit", req.authPass, null, req.body).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.send(fail);

  });

});

//Checking access and if entity type and entity exist

CM.entity.registerHook("hook_entity_access_edit", 0, function (thisHook, data) {

  if (!CM.auth.globals.checkPermissions(["can edit any " + data.entityType], thisHook.authPass)) {

    if (!CM.auth.globals.checkPermissions(["can edit own " + data.entityType], thisHook.authPass)) {

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
