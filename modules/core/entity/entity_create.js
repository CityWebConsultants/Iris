/**
 * @file Functions and hooks for creating entities
 */

/**
 * @member hook_entity_create
 * @memberof entity
 *
 * @desc Creates an entity and saves it to the database
 *
 * The hook variables should be the entity object, including fields and entity type.
 *
 * @param {string} entityType - the entity type
 * @param {string} [author] - the entity author
 */
iris.modules.entity.registerHook("hook_entity_create", 0, function (thisHook, data) {

  if (thisHook.context && !data) {
    data = thisHook.context;
  }

  //Not allowed to send _id when creating as it is set automatically

  if (data._id) {

    thisHook.fail(iris.error(400, "Can't send an ID or current entity when creating an entity. Try update"));
    return false;

  }

  //Set author and entity type

  if (!data.entityType || !iris.entityTypes[data.entityType]) {

    thisHook.fail(iris.error(400, "Needs to have a valid entityType"));
    return false;

  }

  //Set author if not set already

  if (!data.entityAuthor) {

    data.entityAuthor = thisHook.authPass.userid;

  }

  //Check if user has access to create entities

  iris.invokeHook("hook_entity_access_create", thisHook.authPass, null, data).then(function (success) {

    iris.invokeHook("hook_entity_access_create_" + data.entityType, thisHook.authPass, null, data).then(function (successData) {

      validate(data);

    }, function (fail) {

      if (fail === "No such hook exists") {

        validate(data);

      } else {

        thisHook.fail(iris.error(403, "Access denied"));
        return false;

      }

    });

  }, function (fail) {

    thisHook.fail(iris.error(403, "Access denied"));
    return false;

  });

  //Validate function before passing to presave

  var validate = function (data) {

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

  var preSave = function (entity) {

    iris.invokeHook("hook_entity_presave", thisHook.authPass, null, entity).then(function (successData) {

      iris.invokeHook("hook_entity_presave_" + data.entityType, thisHook.authPass, null, entity).then(function (pass) {

        create(successData);

      }, function (fail) {

        if (fail === "No such hook exists") {

          create(successData);

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

  //Create function and related hooks

  var create = function (preparedEntity) {

    var saveEntity = function () {

      iris.invokeHook("hook_db_createEntity__" + iris.config.dbEngine, thisHook.authPass, {
        entityType: preparedEntity.entityType,
        fields: preparedEntity
      }).then(function (doc) {

        iris.invokeHook("hook_entity_created", thisHook.authPass, null, doc);

        iris.invokeHook("hook_entity_created_" + data.entityType, thisHook.authPass, null, doc);

        thisHook.pass(doc);

      }, function (fail) {

        thisHook.fail(fail);

      });

    };

    saveEntity();

  };

});

iris.app.post("/entity/create/:type", function (req, res) {

  req.body.entityType = req.params.type;

  iris.invokeHook("hook_entity_create", req.authPass, null, req.body).then(function (success) {

    res.json(success);

  }, function (fail) {

    if (fail.code) {

      res.status(fail.code).json();

    } else {

      res.status(400).json();

    }

    res.json(JSON.stringify(fail));

  });

});

/**
 * @member hook_entity_validate
 * @memberof entity
 *
 * @desc Validates an entity
 *
 * This hook returns successfully only if the entity provided passes all the checks implemented by the hook.
 */
iris.modules.entity.registerHook("hook_entity_validate", 0, function (thisHook, data) {

  thisHook.pass(data);

});

/**
 * @member hook_entity_access_create
 * @memberof entity
 *
 * @desc Checks permission for creating an entity
 *
 * This hook returns successfully only if the authPass allows for the entity provided to be created.
 */
iris.modules.entity.registerHook("hook_entity_access_create", 0, function (thisHook, data) {

  if (!iris.modules.auth.globals.checkPermissions(["can create " + data.entityType], thisHook.authPass)) {

    thisHook.fail("Access denied");
    return false;

  }

  thisHook.pass(data);

});

/**
 * @member hook_entity_presave
 * @memberof entity
 *
 * @desc Entity presave processing
 *
 * Before saving, implementations of this hook may make changes to the entity such as sanitization
 * or addition of extra fields.
 */
iris.modules.entity.registerHook("hook_entity_presave", 0, function (thisHook, data) {

  // Strip out any embed tags

  Object.keys(data).forEach(function (field) {

    if (typeof data[field] === "string") {

      if (data[field].indexOf("[[[") !== -1 || data[field].indexOf("{{") !== -1) {

        data[field] = data[field].split("[[[").join("").split("]]]").join("");
        data[field] = data[field].split("{{").join("").split("}}").join("");

      }

      if (Array.isArray(data[field])) {

        data[field].forEach(function (currentField, index) {

          if (typeof currentField === "string") {

            data[field][index] = data[field][index].split("[[[").join("").split("]]]").join("");
            data[field][index] = data[field][index].split("{{").join("").split("}}").join("");

          }

        });

      }

    }

  });

  // Check for any unique fields

  var uniqueFields = [];

  Object.keys(data).forEach(function (field) {

    if (iris.entityTypes[data.entityType].fields[field] && iris.entityTypes[data.entityType].fields[field].unique) {

      var condition = {};

      condition[field] = data[field];

      uniqueFields.push(condition);

    }

  });

  if (!uniqueFields.length) {

    thisHook.pass(data);

  } else {

    // TODO Replace this once an OR entity_fetch is put in

    var errors = [];
    var checkedCounter = 0;
    var checked = function () {

      checkedCounter += 1;

      if (checkedCounter === uniqueFields.length) {


        if (errors.length) {

          thisHook.fail(errors.join(" ") + " should be unique");

        } else {

          thisHook.pass(data);

        }

      }

    };

    uniqueFields.forEach(function (field) {

      var fieldName = Object.keys(field)[0];

      var fetch = {
        entities: [data.entityType],
        queries: [{
          "field": fieldName,
          "operator": "is",
          "value": field[fieldName]
        }]

      };

      iris.invokeHook("hook_entity_fetch", "root", null, fetch).then(function (clash) {

        if (clash && clash.length && clash[0].eid !== data.eid) {

          errors.push(fieldName);

        }

        checked();

      });

    });

  }

});
