/**
 * @file Functions and hooks for editing entities
 */

/**
 * @member hook_entity_edit
 * @memberof entity
 *
 * @desc Entity editing hook
 *
 * Updates an entity in the database, and any other stores.
 *
 * Hook variables must include an entity ID (eid) and entity type.
 */
iris.modules.entity.registerHook("hook_entity_edit", 0, function (thisHook, data) {

  var util = require("util");

  if (!data.eid) {

    thisHook.finish(false, iris.error(400, "Have to have an ID to edit something"));
    return false;

  };

  //Set entity type

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
      iris.log("error", err);
      return false;

    }

    if (!doc) {

      thisHook.finish(false, iris.error(400, "Trying to update an entity which doesn't exist"));
      return false;

    }

    if (doc) {

      data.eid = doc.eid;
      data.entityAuthor = doc.entityAuthor;

      runUpdate();

    };

  })

  //Actual run update function

  var runUpdate = function () {
    
    iris.hook("hook_entity_access_edit", thisHook.authPass, null, data).then(function (success) {
      
      iris.hook("hook_entity_access_edit_" + data.entityType, thisHook.authPass, null, data).then(function (success) {

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

    });

  }

  //Validate function before passing to presave

  var validate = function () {

    //Create dummy body so it can't be edited during validation

    var dummyBody = JSON.parse(JSON.stringify(data));

    //    Object.freeze(dummyBody);

    iris.hook("hook_entity_validate", thisHook.authPass, null, dummyBody).then(function (successData) {

      iris.hook("hook_entity_validate_" + data.entityType, thisHook.authPass, null, dummyBody).then(function (pass) {

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

    iris.hook("hook_entity_presave", thisHook.authPass, null, data).then(function (successData) {

      iris.hook("hook_entity_presave_" + data.entityType, thisHook.authPass, null, data).then(function (pass) {

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
      eid: validatedEntity.eid
    };

    delete validatedEntity.eid;
    delete validatedEntity['$$hashKey'];
    
    var update = validatedEntity;

    update.entityType = data.entityType;
    iris.dbCollections[data.entityType].update(conditions, update, callback);

    function callback(err, numAffected) {
      
      if (err) {

        thisHook.finish(false, err);
        return false;

      }

      thisHook.finish(true, "Updated");

      data.eid = conditions.eid;

      iris.hook("hook_entity_updated", thisHook.authPass, null, data)

      iris.log("info", data.entityType + " " + conditions.eid + " edited by " + thisHook.authPass.userid);

    }

  }

});

iris.app.post("/entity/edit/:type/:eid", function (req, res) {

  req.body.entityType = req.params.type;
  req.body.eid = req.params.eid;

  iris.hook("hook_entity_edit", req.authPass, null, req.body).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    if (fail.code) {

      res.status(fail.code);

    }
    else {
      res.status(400);
      res.send(fail.toString());
    }

  });

});

/**
 * @member hook_entity_access_edit
 * @memberof entity
 *
 * @desc Checks permission for editing an entity
 *
 * This hook returns successfully only if the authPass allows for the entity provided to be created.
 */
iris.modules.entity.registerHook("hook_entity_access_edit", 0, function (thisHook, data) {

  if (!iris.modules.auth.globals.checkPermissions(["can edit any " + data.entityType], thisHook.authPass)) {

    if (!iris.modules.auth.globals.checkPermissions(["can edit own " + data.entityType], thisHook.authPass)) {

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
