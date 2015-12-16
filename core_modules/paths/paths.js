C.registerModule("paths", true);

CM.paths.globals.entityPaths = {};

process.on("dbReady", function () {

  for (var collection in C.dbCollections) {

    C.dbCollections[collection].find({
      path: {
        $exists: true
      }
    }, function (err, doc) {

      if (!err && doc) {

        doc.forEach(function (element) {

          CM.paths.globals.entityPaths[element.path] = {
            eid: element.eid,
            entityType: element.entityType
          };

        });

      }

    });

  };

});

CM.paths.registerHook("hook_entity_validate", 0, function (thisHook, data) {

  // Skip if no path on entity

  if (!data.path) {

    thisHook.finish(true, data);
    return false;

  }

  // Check that path is not a duplicate

  var path = data.path;
  var eid = data.eid;

  if (CM.paths.globals.entityPaths[path] && CM.paths.globals.entityPaths[path].eid.toString() !== eid.toString()) {

    C.log("notice", "entity with that path already exists");
    thisHook.finish(false, "Entity with that path already exists");

  } else {

    thisHook.finish(true, data);

  }

});

CM.paths.registerHook("hook_entity_created", 0, function (thisHook, data) {

  if (data.path) {

    var path = data.path;
    var eid = data.eid;
    var entityType = data.entityType;

    CM.paths.globals.entityPaths[path] = {
      eid: eid,
      entityType: entityType
    };

    thisHook.finish(true, data);

  } else {

    thisHook.finish(true, data);

  }

});

CM.paths.registerHook("hook_entity_updated", 0, function (thisHook, data) {

  // Remove any paths in the list that point to this entity

  Object.keys(CM.paths.globals.entityPaths).forEach(function (path) {

    var currentPath = CM.paths.globals.entityPaths[path];

    if (currentPath.eid.toString() === data.eid.toString()) {

      delete CM.paths.globals.entityPaths[path];

    }

  });

  // Recreate them or create anew

  if (data.path) {

    var path = data.path;
    var eid = data.eid;
    var entityType = data.entityType;

    CM.paths.globals.entityPaths[path] = {
      eid: eid,
      entityType: entityType
    };

    thisHook.finish(true, data);

  } else {

    thisHook.finish(true, data);

  }

});

// Handle custom paths

C.app.use(function (req, res, next) {

  if (req.method !== "GET") {

    next();
    return false;

  }

  // Look up entity with the current 'path'
  
  console.log(CM.paths.globals.entityPaths);

  if (CM.paths.globals.entityPaths[req.url]) {

    C.dbCollections[CM.paths.globals.entityPaths[req.url].entityType].findOne({
      eid: CM.paths.globals.entityPaths[req.url].eid
    }, function (err, doc) {

      if (!err && doc) {

        CM.frontend.globals.getTemplate(doc, req.authPass, {
          req: req
        }).then(function (html) {

          res.send(html);

          next();

        }, function (fail) {

          C.hook("hook_display_error_page", req.authPass, {
            error: 500,
            req: req
          }).then(function (success) {

            res.send(success);

          }, function (fail) {

            res.send("500");

          });

        });

      } else {

        next();

      }

    });

  } else {

    next();

  }

});
