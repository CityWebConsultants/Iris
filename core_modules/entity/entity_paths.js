CM.entity.globals.entityPaths = {};

process.on("dbReady", function () {

  for (var collection in C.dbCollections) {

    C.dbCollections[collection].find({path: {$exists: true}}, function (err, doc) {

      if (!err && doc) {

        doc.forEach(function (element) {

          CM.entity.globals.entityPaths[element.path] = {_id: element._id, eId: element.eId};

        });

      }

    });

  };

});

CM.entity.registerHook("hook_entity_validate", 0, function (thisHook, data) {

  // Check that path is not a duplicate

  var path = data.path;
  var id = data._id;

  // If path already listed, and
  //   - Entity is new and has no id, or
  //   - Entity id being edited does not match

  if (CM.entity.globals.entityPaths[path] && (!id || CM.entity.globals.entityPaths[path]._id.toString() !== id.toString())) {

    thisHook.finish(false, "Entity with that path already exists")

  } else {

    thisHook.finish(true, data);

  }

});
