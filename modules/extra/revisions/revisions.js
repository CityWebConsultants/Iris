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

iris.modules.revisions.globals.getRevision = function (entityType, eid, revisionID) {

  return new Promise(function (resolve, reject) {

    iris.modules.revisions.globals.collections[entityType].findOne({
      "eid": parseInt(eid)
    }, function (err, revisions) {

      if (err) {

        res.status(500).send(err);
        return false;

      }

      if (revisions) {

        revisions = revisions.revisions.reverse();

        iris.dbCollections[entityType].findOne({
          eid: parseInt(eid)
        }, function (err, current) {

          if (current) {

            delete current["__v"];
            delete current["_id"];

            // Step through patches

            var i;

            if (revisionID > revisions.length) {

              res.status(400).send("no such revision");
              return false;

            }


            var patched = current.toObject();
            var date;

            for (i = 0; i < revisions.length - revisionID; i += 1) {

              patched = jsondiffpatch.unpatch(patched, revisions[i].diff);
              date = revisions[i].date;

            }

            resolve({
              entity: patched,
              date: date,
              total: revisions.length
            })

          } else {

            reject()

          }

        });

      } else {

        reject();

      }

    });


  })

};

// View entity at past state

iris.route.get("/revisions/:type/:eid/:back", function (req, res) {

  iris.modules.revisions.globals.getRevision(req.params.type, req.params.eid, req.params.back).then(function (revision) {

    var date;
    
    if (revision.date) {

      date = revision.date.getDate() + "/" + revision.date.getMonth() + "/" + revision.date.getFullYear() + " @ " + revision.date.getHours() + ":" + revision.date.getMinutes();

    }

    var message = "";

    if (parseInt(req.params.back) !== 0) {

      message += " <a title='go back' href=/revisions/" + req.params.type + "/" + req.params.eid + "/" + (parseInt(req.params.back) - 1) + ">&#10094;</a> ";

    } else {

      message += " ";

    }

    if (date) {

      message += "Viewing revision from " + date + ".";

    } else {

      message += "Viewing current revision."

    }

    if (req.params.back < revision.total) {

      message += " <a title='go forward' href=/revisions/" + req.params.type + "/" + req.params.eid + "/" + (parseInt(req.params.back) + 1) + ">&#10095;</a> ";

    } else {

      message += " ";

    }

    // Add button to revert

    iris.message(req.authPass.userid, message, "info");

    iris.modules.frontend.globals.parseTemplateFile([revision.entity.entityType, revision.entity.eid], ["html", revision.entity.entityType, revision.entity.eid], {
      current: revision.entity
    }, req.authPass, req).then(function (success) {

      res.send(success);

    }, function (fail) {

      iris.log("error", fail);

      res.status(500).send(fail);

    });

  }, function (fail) {

    res.status(400).send(fail);

  })

})
