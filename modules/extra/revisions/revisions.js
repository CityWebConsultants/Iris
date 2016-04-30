var jsondiffpatch = require('jsondiffpatch').create();

// Initialise database collections for revisions

process.on("dbReady", function () {

  iris.modules.revisions.globals.collections = {};

  var collections = Object.keys(iris.dbCollections);

  collections.forEach(function (collection) {

    var schema = new mongoose.Schema({
      eid: {
        type: Number
      },
      revisions: {
        type: [{
          date: Date,
          diff: mongoose.Schema.Types.Mixed
        }]
      }
    });

    iris.modules.revisions.globals.collections[collection] = mongoose.model("revisions_" + collection, schema);

  })

});

iris.modules.revisions.registerHook("hook_entity_updated", 0, function (thisHook, data) {

  var previous = thisHook.context.previous;
  var current = thisHook.context.new;

  // Create diff

  var diff = jsondiffpatch.diff(previous, current);

  var revisions = iris.modules.revisions.globals.collections[current.entityType];

  revisions.findOneAndUpdate({
    "eid": current.eid
  }, {
    $push: {
      "revisions": {
        date: Date.now(),
        diff: diff
      }
    }
  }, {
    new: true,
    upsert: true
  }, function (err, doc) {

    thisHook.pass(data);

  });

});

// View entity at past state

iris.route.get("/revisions/:type/:eid/:back", function (req, res) {

  if (!iris.modules.revisions.globals.collections[req.params.type]) {

    res.status(400).send("not a valid type");

  }

  iris.modules.revisions.globals.collections[req.params.type].findOne({
    "eid": parseInt(req.params.eid)
  }, function (err, revisions) {

    if (err) {

      res.status(500).send(err);
      return false;

    }

    if (revisions) {

      revisions = revisions.revisions.reverse();

      iris.dbCollections[req.params.type].findOne({
        eid: parseInt(req.params.eid)
      }, function (err, current) {

        if (current) {

          delete current["__v"];
          delete current["_id"];

          // Step through patches

          var i;

          if (req.params.back > revisions.length) {

            res.status(400).send("no such revision");
            return false;

          }

          var patched = current.toObject();

          for (i = 0; i < revisions.length - req.params.back; i += 1) {

            patched = jsondiffpatch.unpatch(patched, revisions[i].diff);

          }

          iris.modules.frontend.globals.parseTemplateFile([patched.entityType, patched.eid], ["html", patched.entityType, patched.eid], {current:patched}, req.authPass, req).then(function (success) {

            res.send(success);

          }, function (fail) {

            iris.log("error", fail);

            res.status(500).send(fail);

          });


        } else {

          res.status(400).send("No such entity");

        }

      })

    } else {

      res.status(400).send("No such entity");

    }

  });

})
