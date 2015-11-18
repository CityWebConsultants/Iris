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
            _id: element._id,
            eId: element.eId,
            entityType: element.entityType
          };

        });

      }

    });

  };

});

// Format a path automatically, e.g. from an entity's title

CM.paths.globals.makePath = function (title) {

  title = title.replace(/[\W_]+/g, "-");

  return title;

};

// Enable AJAX fetching of formatted path so that the edit form can prefill

C.app.get('/admin/api/makepath', function (req, res) {

  res.send(CM.paths.globals.makePath(req.body.title));

});

CM.paths.registerHook("hook_entity_validate", 0, function (thisHook, data) {

  // Check that path is not a duplicate

  var path = data.path;
  var id = data._id;

  // If path already listed, and
  //   - Entity is new and has no id, or
  //   - Entity id being edited does not match

  if (CM.paths.globals.entityPaths[path] && (!id || CM.paths.globals.entityPaths[path]._id.toString() !== id.toString())) {

    thisHook.finish(false, "Entity with that path already exists")

  } else {

    thisHook.finish(true, data);

  }

});

CM.paths.registerHook("hook_entity_created", 0, function (thisHook, data) {

  if (data.path) {

    var path = data.path;
    var id = data._id;
    var eId = data.eId;
    var entityType = data.entityType;

    CM.paths.globals.entityPaths[path] = {
      _id: id,
      eId: eId,
      entityType: entityType
    };

    thisHook.finish(true, data);

  } else {

    thisHook.finish(true, data);

  }

});

CM.paths.registerHook("hook_entity_updated", 0, function (thisHook, data) {

  // Remove any paths in the list that point to this entity

  for (var path in CM.paths.globals.entityPaths) {

    if (CM.paths.globals.entityPaths[path]._id === id) {

      delete CM.paths.globals.entityPaths[path];

    }

  }

  // Recreate them or create anew

  if (data.path) {

    var path = data.path;
    var id = data._id;
    var eId = data.eId;
    var entityType = data.entityType;

    CM.paths.globals.entityPaths[path] = {
      _id: id,
      eId: eId,
      entityType: entityType
    };

    thisHook.finish(true, data);

  } else {

    thisHook.finish(true, data);

  }

});
