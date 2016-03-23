/**
 * @file Hooks, functions and endpoints for fetching entities.
 */

/**
 * @member hook_entity_fetch
 * @memberof entity
 *
 * @desc Entity fetch hook
 *
 * @param {object[]} queryList - array of queries to search database with
 *
 * Currently, only one query at a time is supported.
 *
 * @returns the fetched entities
 */
iris.modules.entity.registerHook("hook_entity_fetch", 0, function (thisHook, fetchRequest) {

  var entityTypes = [];

  // Populate list of targetted DB entities

  if (Array.isArray(fetchRequest.entities)) {

    fetchRequest.entities.forEach(function (entity) {

      if (iris.dbCollections[entity]) {

        entityTypes.push(entity);

      }

    });

  } else {

    thisHook.fail("Not a valid query");

    return false;

  }

  //Assemble query

  var query = {
    $and: []
  };

  if (!fetchRequest.queries) {

    fetchRequest.queries = [];

  }

  if (Array.isArray(fetchRequest.queries)) {

    fetchRequest.queries.forEach(function (fieldQuery) {

      try {

        fieldQuery.value = JSON.parse(fieldQuery.value);

      } catch (e) {

      }

      if (fieldQuery.operator.toLowerCase().indexOf("is") !== -1) {

        var queryItem = {};

        queryItem[fieldQuery["field"]] = fieldQuery.value;

        // Check if negative

        if (fieldQuery.operator.toLowerCase().indexOf("not") === -1) {

          query.$and.push(queryItem);

        } else {

          negativeQueryItem = {};

          negativeQueryItem[Object.keys(queryItem)[0]] = {

            $ne: queryItem[Object.keys(queryItem)[0]]

          };

          query.$and.push(negativeQueryItem);

        }

      }

      if (fieldQuery.operator.toLowerCase().indexOf("gt") !== -1) {

        var queryItem = {};

        queryItem[fieldQuery["field"]] = {
          $gt: fieldQuery.value
        };

        query.$and.push(queryItem);

      }

      if (fieldQuery.operator.toLowerCase().indexOf("includes") !== -1) {

        var queryItem = {};

        if (typeof fieldQuery.value !== "object") {

          queryItem[fieldQuery["field"]] = fieldQuery.value;

        } else {

          queryItem[fieldQuery["field"]] = {
            '$elemMatch': fieldQuery.value
          };

        }

        // Check if negative

        if (fieldQuery.operator.toLowerCase().indexOf("not") === -1) {

          query.$and.push(queryItem);

        } else {

          negativeQueryItem = {};

          negativeQueryItem[Object.keys(queryItem)[0]] = {

            $ne: queryItem[Object.keys(queryItem)[0]]

          };

          query.$and.push(negativeQueryItem);
        }

      }

      if (fieldQuery.operator.toLowerCase().indexOf("contains") !== -1) {

        var queryItem = {};

        var regex = new RegExp(fieldQuery.value, "i");

        queryItem[fieldQuery["field"]] = {
          '$regex': regex
        };

        // Check if negative

        if (fieldQuery.operator.toLowerCase().indexOf("not") === -1) {

          query.$and.push(queryItem);

        } else {

          queryItem[fieldQuery["field"]].$not = regex;

          delete queryItem[fieldQuery["field"]].$regex;

          query.$and.push(queryItem);

        }

      }

    });

    if (fetchRequest.queries.length === 0) {

      query = [];

    }

    var entities = {};

    //Query complete, now run on all entities and collect them

    var dbActions = [];

    var util = require('util');

    entityTypes.forEach(function (type) {

      dbActions.push(iris.promise(function (data, yes, no) {

          var util = require("util");

          var fetch = function (query) {

            iris.dbCollections[type].find(query).lean().sort(fetchRequest.sort).skip(fetchRequest.skip).limit(fetchRequest.limit).exec(function (err, doc) {

              if (err) {

                no(err);

              } else {

                doc.forEach(function (element) {

                  entities[element._id] = element;

                });

                yes();

              }

            });

          };

          iris.invokeHook("hook_entity_query_alter", thisHook.authPass, null, query).then(function (query) {

            iris.invokeHook("hook_entity_query_alter_" + type, thisHook.authPass, null, query).then(function (query) {

              fetch(query);

            }, function (fail) {

              if (fail === "No such hook exists") {

                fetch(query);

              } else {

                no(fail);

              }

            });

          }, function (fail) {

            no(fail);

          });

        })

      );

    });

    var success = function () {

      var viewHooks = [];

      Object.keys(entities).forEach(function (_id) {

        viewHooks.push(iris.promise(function (data, yes, no) {

          //General entity view hook

          iris.invokeHook("hook_entity_view", thisHook.authPass, null, entities[_id]).then(function (viewChecked) {

            if (viewChecked === undefined) {
              no("permission denied");
              return false;
            }

            entities[_id] = viewChecked;

            iris.invokeHook("hook_entity_view_" + viewChecked.entityType, thisHook.authPass, null, entities[_id]).then(function (validated) {

              entities[_id] = validated;
              yes();

            }, function (fail) {

              if (fail === "No such hook exists") {

                yes();

              } else {

                no(fail);

              }

            });

          }, function (fail) {

            no(fail);

          });

        }));

      });

      iris.promiseChain(viewHooks, null, function () {

        var output = [];

        for (entity in entities) {

          output.push(entities[entity]);

        }

        iris.invokeHook("hook_entity_view_bulk", thisHook.authPass, null, output).then(function (output) {

            // Apply sort if one is set

            // Check if sort is present and run it if so

            var sort = function (property, direction) {

              if (direction === "asc") {

                output.sort(function asc(a, b) {
                  if (a[property] < b[property]) {
                    return -1;
                  }
                  if (a[property] > b[property]) {
                    return 1;
                  }
                  return 0;
                });

              } else if (direction === "desc") {

                output.sort(function asc(a, b) {
                  if (a[property] > b[property]) {
                    return -1;
                  }
                  if (a[property] < b[property]) {
                    return 1;
                  }
                  return 0;
                });

              }

            };

            if (fetchRequest.sort) {

              Object.keys(fetchRequest.sort).forEach(function (sorter) {

                sort(sorter, fetchRequest.sort[sorter]);

              });

            }

            if (fetchRequest.limit && output.length > fetchRequest.limit) {

              output.length = fetchRequest.limit;

            }

            thisHook.pass(output);

          },
          function (fail) {

            thisHook.fail(fail);

          });

      }, function (fail) {

        thisHook.fail("Fetch failed");

      });

    };

    var fail = function (fail) {

      thisHook.fail(fail);

    };

    if (!dbActions.length) {

      thisHook.pass(null);

    }

    iris.promiseChain(dbActions, null, success, fail);

  } else {

    thisHook.fail("not a valid query");

  }

});

iris.app.get("/fetch", function (req, res) {

  // Check if user can fetch this entity type

  var failed;

  if (req.query.entities) {

    req.query.entities.forEach(function (entityType) {

      if (!iris.modules.auth.globals.checkPermissions(["can fetch " + entityType], req.authPass)) {

        iris.log("warn", "User " + req.authPass.userid + " was denied access to fetch " + entityType + " list ");

        res.status(403).json("Cannot fetch");
        failed = true;

      }

    });

  } else {

    res.status(400).json("Not a valid entity fetch query");

  }

  if (failed) {

    return false;

  }


  iris.invokeHook("hook_entity_fetch", req.authPass, null, req.query).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.respond(400, fail);

  })

});

/**
 * @member hook_entity_query_alter
 * @memberof entity
 *
 * @desc Allows altering and overriding entity fetch queries
 *
 * Runs before hook_entity_fetch actually searches the database.
 */
iris.modules.entity.registerHook("hook_entity_query_alter", 0, function (thisHook, query) {

  thisHook.pass(query);

});

/**
 * @member hook_entity_view
 * @memberof entity
 *
 * @desc Entity view processing
 *
 * Allows for altering and overriding an entity when it is prepared for view by a user.
 */
iris.modules.entity.registerHook("hook_entity_view", 0, function (thisHook, entity) {

  // Add timestamp

  var entity = JSON.parse(JSON.stringify(entity));

  var mongoid = mongoose.Types.ObjectId(entity._id);

  entity.timestamp = Date.parse(mongoid.getTimestamp());

  // Check if user can see entity type

  var isOwn = thisHook.authPass.userid == entity.entityAuthor;
  var viewOwn = iris.modules.auth.globals.checkPermissions(["can view own " + entity.entityType], thisHook.authPass);
  var viewAny = iris.modules.auth.globals.checkPermissions(["can view any " + entity.entityType], thisHook.authPass);
  if (!viewAny && !(isOwn && viewOwn)) {

      //Can't view any of this type, delete it
      entity = undefined;

  }


  // Strip out any fields on the entity that a user shouldn't be able to see according to field permissions

  if (entity) {

    var type = entity.entityType;

    Object.keys(entity).forEach(function (field) {

      if (field !== "entityAuthor" && field !== "entityType" && field !== "eid" && field !== "_id" && field !== "__v") {

        var schemaField = iris.dbCollections[type].schema.tree[field];

        if (schemaField && thisHook.authPass.roles.indexOf("admin") === -1) {

          if (!schemaField.permissions) {

            delete entity[field];

          } else {

            var canView = false;

            thisHook.authPass.roles.forEach(function (role) {

              if (schemaField.permissions.indexOf(role) !== -1) {

                canView = true;

              }

            });

            if (!canView) {

              delete entity[field];

            }

          }

        }

      }

    });

    var entityType = entity.entityType;

    var schema = iris.dbSchemaConfig[entityType];

    // Loop over all the fields on the entity

    var fieldHooks = [];

    Object.keys(entity).forEach(function (field) {

      if (schema.fields[field] && schema.fields[field].fieldType) {

        var fieldType = iris.sanitizeName(schema.fields[field].fieldType);

        fieldHooks.push({
          type: fieldType,
          field: field
        });

      }

    })

    var fieldCheckedCounter = 0;

    var fieldChecked = function () {

      fieldCheckedCounter += 1;

      if (fieldCheckedCounter === fieldHooks.length) {

        thisHook.pass(entity);

      }

    };

    // Run hook for each field

    if(fieldHooks.length === 0) {
      thisHook.pass(entity);
    }

    fieldHooks.forEach(function (field) {

      iris.invokeHook("hook_entity_view_field__" + field.type, thisHook.authPass, {
        entityType: entity.entityType,
        field: iris.dbSchemaConfig[entity.entityType].fields[field.field]
      }, entity[field.field]).then(function (newValue) {

        entity[field.field] = newValue;
        fieldChecked();

      }, function (fail) {

        fieldChecked();

      });

    });

    thisHook.pass(entity);

  } else {

    thisHook.pass(entity);
    
  }

});

/**
 * @member hook_entity_view_bulk
 * @memberof entity
 *
 * @desc Bulk view processing for loading many entities at once.
 *
 * @see hook_entity_view
 */
iris.modules.entity.registerHook("hook_entity_view_bulk", 0, function (thisHook, entityList) {

  thisHook.pass(entityList);

});

require("./entity_views.js");
