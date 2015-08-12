C.app.get("/fetch", function (req, res) {

  var entityTypes = [];

  //Populate list of targetted DB entities

  if (Array.isArray(req.body.entities)) {

    req.body.entities.forEach(function (entity) {

      if (C.dbCollections[entity]) {

        entityTypes.push(entity);

      }

    });

  } else {

    res.send("Not a valid query");

  }

  //Assemble query

  var query = {};

  if (Array.isArray(req.body.queries)) {

    req.body.queries.forEach(function (fieldQuery) {

      if (fieldQuery.comparison === "IS") {

        query[fieldQuery.field] = fieldQuery.compare;

      }

      if (fieldQuery.comparison === "IN") {

        query[fieldQuery.field] = {
          '$elemMatch': fieldQuery.compare
        }

      };

    });

    var entities = {};

    //Query complete, now run on all entities and collect them

    var dbActions = [];

    entityTypes.forEach(function (type) {

      entities[type] = [];

      dbActions.push(C.promise(function (data, yes, no) {
          C.dbCollections[type].find(query, function (err, doc) {

            if (err) {

              no(err);

            } else {

              doc.forEach(function (element) {

                entities[type].push(element);

              });

              yes();

            }

          });

        })

      );

    });

    var success = function () {

      var viewHooks = [];

      Object.keys(entities).forEach(function (entityBundle) {

        viewHooks.push(C.promise(function (data, yes, no) {

          C.hook("hook_entity_view_" + entityBundle, entities[entityBundle], req.authPass).then(function (validated) {

            entities[entityBundle] = validated;
            yes();

          }, function (fail) {

            if (fail === "No such hook exists") {

              yes();

            } else {

              no();

            }

          })

        }));

      });

      C.promiseChain(viewHooks, null, function (success) {

        res.respond(200, entities, "Something went a bit odd");

      }, function (fail) {

        res.send("Fetch failed");

      });

    };

    var fail = function (fail) {

      console.log(fail);
      res.send("Database error");

    };

    C.promiseChain(dbActions, null, success, fail);

  } else {

    res.send("not a valid query");

  }

});
