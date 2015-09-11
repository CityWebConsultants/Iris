C.app.get("/fetch", function (req, res) {

  if (req.body.queryList) {

    // Current accepting only one query at a time but sending as an array for future multiqueries

    if (req.body.queryList && Array.isArray(req.body.queryList)) {

      req.body.entities = req.body.queryList[0].entities;
      req.body.queries = req.body.queryList[0].queries;
      req.body.limit = req.body.queryList[0].limit;
      req.body.sort = req.body.queryList[0].sort;
      req.body.skip = req.body.queryList[0].skip;

    } else {

      res.respond(400, "Send queries as array");
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

    res.respond(400, "Not a valid query");
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

      entities[type] = [];

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

                  entities[type].push(element);

                });

                yes();

              }

            });

          };

          C.hook("hook_entity_query_alter", query, req.authPass).then(function (query) {

            C.hook("hook_entity_query_alter_" + type, query, req.authPass).then(function (query) {

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

      Object.keys(entities).forEach(function (entityBundle) {

        viewHooks.push(C.promise(function (data, yes, no) {

          //General entity view hook

          C.hook("hook_entity_view", entities, req.authPass).then(function (viewChecked) {

            entities = viewChecked;

            if (!entities[entityBundle]) {

              no("No entities");
              return false;

            }

            C.hook("hook_entity_view_" + entityBundle, entities[entityBundle], req.authPass).then(function (validated) {

              entities[entityBundle] = validated;
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

      C.promiseChain(viewHooks, null, function (success) {

        res.respond(200, entities);

      }, function (fail) {

        res.send("Fetch failed");

      });

    };

    var fail = function (fail) {

      console.log(fail);

      res.respond(500, "Database error");

    };

    C.promiseChain(dbActions, null, success, fail);

  } else {

    res.send("not a valid query");

  }

});


CM.entity.registerHook("hook_entity_query_alter", 0, function (thisHook, query) {

  thisHook.finish(true, query);

});

CM.entity.registerHook("hook_entity_view", 0, function (thisHook, data) {

  // Add timestamp

  Object.keys(data).forEach(function (type) {

    data[type].forEach(function (entity) {

      if (entity._id) {

        var mongoid = mongoose.Types.ObjectId(entity._id);

        entity.timestamp = Date.parse(mongoid.getTimestamp());

      }

    });

  });

  //Loop over entity types and check if user can see them

  Object.keys(data).forEach(function (type) {

    if (!CM.auth.globals.checkPermissions(["can view any " + type], thisHook.authPass)) {

      if (!CM.auth.globals.checkPermissions(["can view own " + type], thisHook.authPass)) {

        //Can't view any of this type, delete them

        delete data[type];

      } else {

        //Loop over all entities to check if any are owned by the user, remove others

        data[type].forEach(function (item, index) {

          if (item.entityAuthor !== thisHook.authPass.userid) {

            if (data[type]) {
              data[type] = data[type].splice[index, 1];

            }
          }

        });

      }
    }

  });

  thisHook.finish(true, data);

});
