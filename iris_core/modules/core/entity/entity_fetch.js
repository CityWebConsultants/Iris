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
iris.modules.entity.registerHook("hook_entity_fetch", 0, function (thisHook, data) {

  var req = {};
  req.body = data;

  var entityTypes = [];

  // Populate list of targetted DB entities
  
  if (Array.isArray(req.body.entities)) {
    
    req.body.entities.forEach(function (entity) {

      if (iris.dbCollections[entity]) {

        entityTypes.push(entity);

      }

    });

  } else {

    thisHook.finish(false, "Not a valid query");
    return false;


  }

  //Assemble query

  var query = {
    $and: []
  };
  
  if (!req.body.queries) {

    req.body.queries = [];

  }

  if (Array.isArray(req.body.queries)) {

    req.body.queries.forEach(function (fieldQuery) {

      try {

        fieldQuery.value = JSON.parse(fieldQuery.value);

      } catch (e) {

      }

      if (fieldQuery.operator.toLowerCase().indexOf("is") !== -1) {

        var queryItem = {};

        queryItem[fieldQuery["field"]] = fieldQuery.value

        // Check if negative

        if (fieldQuery.operator.toLowerCase().indexOf("not") === -1) {
          query.$and.push(queryItem);
        } else {

          negativeQueryItem = {};

          negativeQueryItem[Object.keys(queryItem)[0]] = {

            $ne: queryItem[Object.keys(queryItem)[0]]

          }

          query.$and.push(negativeQueryItem);

        }

      }

      if (fieldQuery.operator.toLowerCase().indexOf("includes") !== -1) {

        var queryItem = {};

        if (typeof fieldQuery.value !== "object") {

          queryItem[fieldQuery["field"]] = fieldQuery.value;

        } else {

          queryItem[fieldQuery["field"]] = {
            '$elemMatch': fieldQuery.value
          }

        }

        // Check if negative

        if (fieldQuery.operator.toLowerCase().indexOf("not") === -1) {
          query.$and.push(queryItem);
        } else {

          negativeQueryItem = {};

          negativeQueryItem[Object.keys(queryItem)[0]] = {

            $ne: queryItem[Object.keys(queryItem)[0]]

          }

          query.$and.push(negativeQueryItem);
        }

      };

      if (fieldQuery.operator.toLowerCase().indexOf("contains") !== -1) {

        var queryItem = {};

        var regex = new RegExp(fieldQuery.value, "i");

        queryItem[fieldQuery["field"]] = {
          '$regex': regex
        }

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

    if (req.body.queries.length === 0) {

      query = [];

    }

    //    Debugger for queries

    /*var util = require("util");

    console.log(util.inspect(query, {
      depth: 10
    }));*/

    var entities = {};

    //Query complete, now run on all entities and collect them

    var dbActions = [];

    var util = require('util');

    entityTypes.forEach(function (type) {

      //First check if the user can view those entities.

      if (!iris.modules.auth.globals.checkPermissions(["can view any " + type], thisHook.authPass)) {

        return false;

      }

      dbActions.push(iris.promise(function (data, yes, no) {

          var util = require("util");

          var fetch = function (query) {

            iris.dbCollections[type].find(query).lean().sort(req.body.sort).skip(req.body.skip).limit(req.body.limit).exec(function (err, doc) {

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

          iris.hook("hook_entity_query_alter", thisHook.authPass, null, query).then(function (query) {

            iris.hook("hook_entity_query_alter_" + type, thisHook.authPass, null, query).then(function (query) {

              fetch(query);

            }, function (fail) {

              if (fail === "No such hook exists") {

                fetch(query);

              } else {

                no(fail);

              }

            })

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

          iris.hook("hook_entity_view", thisHook.authPass, null, entities[_id]).then(function (viewChecked) {

            entities[_id] = viewChecked;

            iris.hook("hook_entity_view_" + viewChecked.entityType, thisHook.authPass, null, entities[_id]).then(function (validated) {

              entities[entity._id] = validated;
              yes();

            }, function (fail) {

              if (fail === "No such hook exists") {

                yes();

              } else {

                no(fail);

              }

            })

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

        iris.hook("hook_entity_view_bulk", thisHook.authPass, null, output).then(function (output) {

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
                })

              } else if (direction === "desc") {

                output.sort(function asc(a, b) {
                  if (a[property] > b[property]) {
                    return -1;
                  }
                  if (a[property] < b[property]) {
                    return 1;
                  }
                  return 0;
                })

              }

            }

            if (req.body.sort) {

              Object.keys(req.body.sort).forEach(function (sorter) {
                sort(sorter, req.body.sort[sorter])

              })

            }

            if (req.body.limit && output.length > req.body.limit) {

              output.length = req.body.limit;

            }

            thisHook.finish(true, output);

          },
          function (fail) {

            thisHook.finish(false, fail);

          });

      }, function (fail) {

        thisHook.finish(false, "Fetch failed");

      });

    };

    var fail = function (fail) {

      thisHook.finish(false, fail);

    };

    if (!dbActions.length) {

      thisHook.finish(true, null);

    }

    iris.promiseChain(dbActions, null, success, fail);

  } else {

    thisHook.finish(false, "not a valid query");

  }

});

iris.app.get("/fetch", function (req, res) {
  
  // Check if user can fetch this entity type

  var failed;

  if (req.body.entities) {
    
    req.body.entities.forEach(function (entityType) {
            
      if (!iris.modules.auth.globals.checkPermissions(["can fetch " + entityType], req.authPass)) {

        iris.log("warn", "User " + req.authPass.userid + " was denied access to fetch " + entityType + " list ");

        res.status(403).send("Cannot fetch");
        failed = true;

      };

    })

  } else {
    
    res.status(400).send("Not a valid entity fetch query");

  }

  if (failed) {

    return false;

  }


  iris.hook("hook_entity_fetch", req.authPass, null, req.body).then(function (success) {

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

  thisHook.finish(true, query);

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

  if (!iris.modules.auth.globals.checkPermissions(["can view any " + entity.entityType], thisHook.authPass)) {

    if (!iris.modules.auth.globals.checkPermissions(["can view own " + entity.entityType], thisHook.authPass)) {

      //Can't view any of this type, delete it

      entity = undefined;

    } else {

      // Check if owned by user

      if (entity.entityAuthor !== thisHook.authPass.userid) {

        entity = undefined;

      }

    }
  }

  // Strip out any fields on the entity that a user shouldn't be able to see according to field permissions

  if (entity) {

    var type = entity.entityType;

    Object.keys(entity).forEach(function (field) {

      if (field !== "entityAuthor" && field !== "entityType" && field !== "eid" && field !== "_id") {

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

            })

            if (!canView) {

              delete entity[field];

            }

          }


        }

      }

    })

  }

  thisHook.finish(true, entity);

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

  thisHook.finish(true, entityList);

});

require("./entity_views.js")
