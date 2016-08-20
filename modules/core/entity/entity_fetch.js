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

iris.modules.entity.globals.queryCache = {};

iris.modules.entity.registerHook("hook_entity_fetch", 0, function (thisHook, fetchRequest) {

  if (thisHook.context) {

    fetchRequest = thisHook.context;

  }

  var success;

  var entities = {};

  //Query complete, now run on all entities and collect them

  var dbActions = [];

  // TODO enable query caching -- commented out for now

  if (!iris.modules.entity.globals.queryCache[JSON.stringify(fetchRequest)]) {

    var entityTypes = [];

    // Populate list of targetted DB entities

    if (Array.isArray(fetchRequest.entities)) {

      fetchRequest.entities.forEach(function (entityType) {

        if (iris.entityTypes[entityType]) {

          entityTypes.push(entityType);

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

    if (!Array.isArray(fetchRequest.queries)) {

      return thisHook.fail("not a valid query");

    }

    fetchRequest.queries.forEach(function (fieldQuery) {

      try {

        fieldQuery.value = JSON.parse(fieldQuery.value);

      } catch (e) {

      }

      var queryItem = {},
        negativeQueryItem = {};

      if (fieldQuery.operator.toLowerCase().indexOf("is") !== -1) {

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

        queryItem[fieldQuery["field"]] = {
          $gt: fieldQuery.value
        };

        query.$and.push(queryItem);

      }

      if (fieldQuery.operator.toLowerCase().indexOf("includes") !== -1) {

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

    var util = require('util');

    entityTypes.forEach(function (type) {

      dbActions.push(iris.promise(function (data, yes, no) {

          var fetch = function (query) {

            var queryObject = {
              query: query,
              entityType: type,
              limit: fetchRequest.limit,
              sort: fetchRequest.sort,
              skip: fetchRequest.skip
            };

            iris.invokeHook("hook_db_fetch__" + iris.config.dbEngine, thisHook.authPass, queryObject).then(function (fetched) {

              fetched.forEach(function (element) {

                entities[element._id] = element;

              });

              yes();

            }, function (fail) {

              no(fail);

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

  }

  success = function () {

    if (iris.config.cacheQueries) {

      if (iris.modules.entity.globals.queryCache[JSON.stringify(fetchRequest)]) {

        entities = iris.modules.entity.globals.queryCache[JSON.stringify(fetchRequest)];

      } else {

        iris.modules.entity.globals.queryCache[JSON.stringify(fetchRequest)] = entities;

      }

    }

    var viewHooks = [];

    Object.keys(entities).forEach(function (_id, index) {

      viewHooks.push(new Promise(function (yes, no) {

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

    Promise.all(viewHooks).then(function () {

      var output = [];

      for (var entity in entities) {

        output.push(entities[entity]);

      }

      iris.invokeHook("hook_entity_view_bulk", thisHook.authPass, null, output).then(function (output) {

          // Apply sort if one is set

          // Check if sort is present and run it if so

          var sort = function (property, direction) {

            if (direction === 1) {

              output.sort(function (a, b) {
                if (a[property] < b[property]) {
                  return -1;
                }
                if (a[property] > b[property]) {
                  return 1;
                }
                return 0;
              });

            } else if (direction === -1) {

              output.sort(function (a, b) {
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

            output = output.slice(0, fetchRequest.limit);

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

  iris.promiseChain(dbActions, null, success, fail);

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

  });

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

  if (entity) {

    entity = JSON.parse(JSON.stringify(entity));

  } else {

    thisHook.pass(entity);

  }

  // Add timestamp TODO need a general way of doing this now database is not MongoDB only.

  //  var mongoid = mongoose.Types.ObjectId(entity._id);
  //  entity.timestamp = Date.parse(mongoid.getTimestamp());

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

        var schemaField = iris.entityTypes[type].fields[field];

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

    var schema = iris.entityTypes[entityType];

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

    });

    var fieldCheckedCounter = 0;

    var fieldChecked = function () {

      fieldCheckedCounter += 1;

      if (fieldCheckedCounter === fieldHooks.length) {

        thisHook.pass(entity);

      }

    };

    // Run hook for each field

    if (fieldHooks.length === 0) {
      thisHook.pass(entity);
    }

    fieldHooks.forEach(function (field) {

      iris.invokeHook("hook_entity_view_field__" + field.type, thisHook.authPass, {
        entityType: entity.entityType,
        field: iris.entityTypes[entity.entityType].fields[field.field]
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
