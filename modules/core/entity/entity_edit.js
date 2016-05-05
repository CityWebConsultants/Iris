/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise*/

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

    thisHook.fail(iris.error(400, "Have to have an ID to edit something"));
    return false;

  }

  //Set entity type

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
      iris.log("error", err);
      return false;

    }

    if (!doc) {

      thisHook.fail(iris.error(400, "Trying to update an entity which doesn't exist"));
      return false;

    }

    if (doc) {
      var type = data.entityType;
      Object.keys(data).forEach(function (field) {

        if (field !== "entityAuthor" && field !== "entityType" && field !== "eid" && field !== "_id" && field !== "__v") {

          var schemaField = iris.dbCollections[type].schema.tree[field];

          if (schemaField && thisHook.authPass.roles.indexOf("admin") === -1) {

            if (!schemaField.edit_permissions) {
              iris.log("warn", "field edit without permission attempt ignored for field : " + field + "with value : " + data[field]);
              delete data[field];
            } else {

              var canEdit = false;
              thisHook.authPass.roles.forEach(function (role) {

                if (schemaField.edit_permissions.indexOf(role) !== -1) {

                  canEdit = true;
                }

              });

              if (!canEdit) {
                iris.log("warn", "field edit without permission attempt ignored for field : " + field + "with value : " + data[field]);
                delete data[field];

              }

            }

          }

        }

      });
      data.eid = doc.eid;
      data.entityAuthor = doc.entityAuthor;

      runUpdate();

    }

  });

  //Actual run update function

  var runUpdate = function () {

    iris.invokeHook("hook_entity_access_edit", thisHook.authPass, null, data).then(function (success) {

      iris.invokeHook("hook_entity_access_edit_" + data.entityType, thisHook.authPass, null, data).then(function (success) {

        validate();

      }, function (fail) {

        if (fail === "No such hook exists") {

          validate();

        } else {

          thisHook.fail(fail);

        }

      });


    }, function (fail) {

      thisHook.fail(fail);

    });

  };

  //Validate function before passing to presave

  var validate = function () {

    //Create dummy body so it can't be edited during validation

    var dummyBody = JSON.parse(JSON.stringify(data));

    //    Object.freeze(dummyBody);

    iris.invokeHook("hook_entity_validate", thisHook.authPass, null, dummyBody).then(function (successData) {

      iris.invokeHook("hook_entity_validate_" + data.entityType, thisHook.authPass, null, dummyBody).then(function (pass) {

        preSave(data);

      }, function (fail) {

        if (fail === "No such hook exists") {

          preSave(data);

        } else {

          thisHook.fail(fail);
          return false;

        }

      });

    }, function (fail) {

      thisHook.fail(fail);
      return false;

    });

  };

  //Presave function

  var preSave = function () {

    iris.invokeHook("hook_entity_presave", thisHook.authPass, null, data).then(function (successData) {

      iris.invokeHook("hook_entity_presave_" + data.entityType, thisHook.authPass, null, data).then(function (pass) {

        update(pass);

      }, function (fail) {

        if (fail === "No such hook exists") {

          update(successData);

        } else {

          thisHook.fail(fail);
          return false;

        }

      });

    }, function (fail) {

      thisHook.fail(fail);
      return false;

    });

  };

  var update = function (validatedEntity) {


    var conditions = {
      eid: validatedEntity.eid
    };

    delete validatedEntity.eid;
    delete validatedEntity.$$hashKey;

    var update = validatedEntity;

    update.entityType = data.entityType;
    iris.dbCollections[data.entityType].update(conditions, update, callback);

    function callback(err, numAffected) {

      if (err) {

        thisHook.fail(err);
        return false;

      }

      thisHook.pass("Updated");

      data.eid = conditions.eid;

      iris.invokeHook("hook_entity_updated", thisHook.authPass, null, data);

      iris.log("info", data.entityType + " " + conditions.eid + " edited by " + thisHook.authPass.userid);

    }

  };

});

iris.app.post("/entity/edit/:type/:eid", function (req, res) {

  req.body.entityType = req.params.type;
  req.body.eid = req.params.eid;

  iris.invokeHook("hook_entity_edit", req.authPass, null, req.body).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    if (fail.code) {

      res.status(fail.code).json();

    }
    else {
      res.status(400).json(fail.toString());
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
