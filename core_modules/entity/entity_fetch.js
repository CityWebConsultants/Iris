CM.entity.registerHook("hook_entity_fetch", 0, function (thisHook, data) {

  var req = {};
  req.body = data;

  if (req.body.queryList) {

    // Current accepting only one query at a time but sending as an array for future multiqueries

    if (req.body.queryList && Array.isArray(req.body.queryList)) {

      req.body.entities = req.body.queryList[0].entities;
      req.body.queries = req.body.queryList[0].queries;
      req.body.limit = req.body.queryList[0].limit;
      req.body.sort = req.body.queryList[0].sort;
      req.body.skip = req.body.queryList[0].skip;

    } else {

      thisHook.finish(false, "Send queries as an array");
      return false;

    }

  }

  var entityTypes = [];

  // Populate list of targetted DB entities

  if (Array.isArray(req.body.entities)) {

    req.body.entities.forEach(function (entity) {

      if (C.dbCollections[entity]) {

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

        fieldQuery.compare = JSON.parse(fieldQuery.compare);

      } catch (e) {

      }

      if (fieldQuery.comparison === "IS") {

        var queryItem = {};

        queryItem[fieldQuery["field"]] = fieldQuery.compare

        query.$and.push(queryItem);

      }

      if (fieldQuery.comparison === "IN") {

        var queryItem = {};

        queryItem[fieldQuery["field"]] = {
          '$elemMatch': fieldQuery.compare
        }

        query.$and.push(queryItem);

      };

      if (fieldQuery.comparison === 'CONTAINS') {

        var queryItem = {};

        queryItem[fieldQuery["field"]] = {
          '$regex': fieldQuery.compare,
          '$options': 'i'
        }

        query.$and.push(queryItem);

      }

    });

    if (req.body.queries.length === 0) {

      query = [];

    }

    var entities = {};

    //Query complete, now run on all entities and collect them

    var dbActions = [];

    var util = require('util');

    entityTypes.forEach(function (type) {

      //First check if the user can view those entities.

      if (!CM.auth.globals.checkPermissions(["can view any " + type], thisHook.authPass)) {

        return false;

      }

      dbActions.push(C.promise(function (data, yes, no) {

          var fetch = function (query) {

            C.dbCollections[type].find(query).lean().sort(req.body.sort).skip(req.body.skip).limit(req.body.limit).exec(function (err, doc) {

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

          C.hook("hook_entity_query_alter", thisHook.authPass, null, query).then(function (query) {

            C.hook("hook_entity_query_alter_" + type, thisHook.authPass, null, query).then(function (query) {

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

        viewHooks.push(C.promise(function (data, yes, no) {

          //General entity view hook

          C.hook("hook_entity_view", thisHook.authPass, null, entities[_id]).then(function (viewChecked) {

            entities[_id] = viewChecked;

            C.hook("hook_entity_view_" + viewChecked.entityType, thisHook.authPass, null, entities[_id]).then(function (validated) {

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

      C.promiseChain(viewHooks, null, function () {

        var output = [];

        for (entity in entities) {

          output.push(entities[entity]);

        }

        C.hook("hook_entity_view_bulk", thisHook.authPass, null, output).then(function (output) {

          thisHook.finish(true, output);

        }, function (fail) {

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

    C.promiseChain(dbActions, null, success, fail);

  } else {

    thisHook.finish(false, "not a valid query");

  }

});

C.app.get("/fetch", function (req, res) {

  C.hook("hook_entity_fetch", req.authPass, null, req.body).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.respond(400, fail);

  })

});


CM.entity.registerHook("hook_entity_query_alter", 0, function (thisHook, query) {

  thisHook.finish(true, query);

});

CM.entity.registerHook("hook_entity_view", 0, function (thisHook, entity) {

  // Add timestamp

  var entity = JSON.parse(JSON.stringify(entity));

  var mongoid = mongoose.Types.ObjectId(entity._id);

  entity.timestamp = Date.parse(mongoid.getTimestamp());

  // Check if user can see entity type

  if (!CM.auth.globals.checkPermissions(["can view any " + entity.entityType], thisHook.authPass)) {

    if (!CM.auth.globals.checkPermissions(["can view own " + entity.entityType], thisHook.authPass)) {

      //Can't view any of this type, delete it

      entity = undefined;

    } else {

      // Check if owned by user

      if (entity.entityAuthor !== thisHook.authPass.userid) {

        entity = undefined;

      }

    }
  }

  thisHook.finish(true, entity);

});

CM.entity.registerHook("hook_entity_view_bulk", 0, function (thisHook, entityList) {

  thisHook.finish(true, entityList);

});
