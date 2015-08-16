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

    res.respond(400, "Not a valid query");
    return false;


  }

  //Assemble query

  var query = {};

  if (!req.body.queries) {

    req.body.queries = [];

  }

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
          C.dbCollections[type].find(query).lean().exec(function (err, doc) {

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

          //General entity view hook 

          C.hook("hook_entity_view", entities, req.authPass).then(function (viewChecked) {

            entities = viewChecked;

            if (!entities[entityBundle]) {

              no();
              return false;

            }

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

          }, function (fail) {

            no();

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
      res.send("Database error");

    };

    C.promiseChain(dbActions, null, success, fail);

  } else {

    res.send("not a valid query");

  }

});

CM.entity.registerHook("hook_entity_view", 0, function (thisHook, data) {

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

            data[type] = data[type].splice[index, 1];

          }

        });

      }


    }

  });

  thisHook.finish(true, data);

});
