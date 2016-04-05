/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

iris.registerModule("paths");

iris.modules.paths.globals.entityPaths = {};

process.on("dbReady", function () {

  for (var collection in iris.dbCollections) {

    iris.dbCollections[collection].find({
      path: {
        $exists: true
      }
    }, function (err, doc) {

      if (!err && doc) {

        doc.forEach(function (element) {

          iris.modules.paths.globals.entityPaths[element.path] = {
            eid: element.eid,
            entityType: element.entityType
          };

        });

      }

    });

  }

});

iris.modules.paths.registerHook("hook_entity_validate", 0, function (thisHook, data) {

  // Skip if no path on entity

  if (!data.path) {

    thisHook.pass(data);
    return false;

  }

  // Check that path is not a duplicate

  var path = data.path;
  var eid = data.eid;

  if (!eid) {

    // Must be creating

    eid = "new";

  }

  if (iris.modules.paths.globals.entityPaths[path] && iris.modules.paths.globals.entityPaths[path].eid.toString() !== eid.toString()) {

    thisHook.fail("Entity with that path already exists");

  } else {

    thisHook.pass(data);

  }

});

iris.modules.paths.registerHook("hook_entity_created", 0, function (thisHook, data) {

  if (data.path) {

    var path = data.path;
    var eid = data.eid;
    var entityType = data.entityType;

    iris.modules.paths.globals.entityPaths[path] = {
      eid: eid,
      entityType: entityType
    };

    thisHook.pass(data);

  } else {

    thisHook.pass(data);

  }

});

// Remove any paths listed for an entity if it's deleted

iris.modules.paths.registerHook("hook_entity_deleted", 0, function (thisHook, data) {

  Object.keys(iris.modules.paths.globals.entityPaths).forEach(function (path) {

    var currentPath = iris.modules.paths.globals.entityPaths[path];

    if (currentPath.eid.toString() === data.eid.toString()) {

      delete iris.modules.paths.globals.entityPaths[path];

    }

  });

  thisHook.pass(data);

});

iris.modules.paths.registerHook("hook_entity_updated", 0, function (thisHook, data) {

  // Remove any paths in the list that point to this entity

  Object.keys(iris.modules.paths.globals.entityPaths).forEach(function (path) {

    var currentPath = iris.modules.paths.globals.entityPaths[path];

    if ((currentPath.eid.toString() === data.eid.toString()) && (currentPath.entityType === data.entityType)) {

      delete iris.modules.paths.globals.entityPaths[path];

    }

  });

  // Recreate them or create anew

  if (data.path) {

    var path = data.path;
    var eid = data.eid;
    var entityType = data.entityType;

    iris.modules.paths.globals.entityPaths[path] = {
      eid: eid,
      entityType: entityType
    };

    thisHook.pass(data);

  } else {

    thisHook.pass(data);

  }

});

// Handle custom paths

iris.app.use(function (req, res, next) {

  if (req.method !== "GET") {

    next();
    return false;

  }

  // we only want the pathname, not hash/querystrings
  var url = require('url'),
    currentPath = url.parse(req.url).pathname;

  // Look up entity with the current 'path'

  if (iris.modules.paths.globals.entityPaths[currentPath]) {

    iris.dbCollections[iris.modules.paths.globals.entityPaths[currentPath].entityType].findOne({
      eid: iris.modules.paths.globals.entityPaths[currentPath].eid
    }, function (err, doc) {

      if (!err && doc) {

        iris.modules.frontend.globals.getTemplate(doc, req.authPass, {
          req: req
        }).then(function (html) {

          res.send(html);

          next();

        }, function (fail) {

          iris.invokeHook("hook_display_error_page", req.authPass, {
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
