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

iris.modules.revisions.globals.getRevision = function (entityType, eid, revisionID, authPass) {

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

              reject("no such revision");
              return false;

            }


            var patched = current.toObject();
            var date;

            for (i = 0; i < revisions.length - revisionID; i += 1) {

              patched = jsondiffpatch.unpatch(patched, revisions[i].diff);
              date = revisions[i].date;

            }

            // Do permissions checks on entity

            iris.invokeHook("hook_entity_view", authPass, patched, patched).then(function (entity) {

              iris.invokeHook("hook_entity_view__" + entityType, authPass, entity, entity).then(function (validatedEntity) {

                if (validatedEntity) {

                  resolve({
                    entity: validatedEntity,
                    date: date,
                    total: revisions.length
                  })


                } else {

                  reject(403);

                }

              }, function (fail) {

                reject(403);

              });

            }, function (fail) {

              reject(403);

            })


          } else {

            reject(400)

          }

        });

      } else {

        reject(400);

      }

    });


  })

};

// View entity at past state

iris.route.get("/revisions/:type/:eid/:back", function (req, res) {

  iris.modules.revisions.globals.getRevision(req.params.type, req.params.eid, req.params.back, req.authPass).then(function (revision) {

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

    if (!isNaN(fail)) {

      iris.invokeHook("hook_display_error_page", req.authPass, {
        error: fail,
        req: req
      }).then(function (success) {

        res.send(success);

      }, function (fail) {

        res.status(fail).send(fail);

      });

    } else {

      res.status(400).send(fail);

    }

  })

});

iris.modules.revisions.globals.revertRevision = function (entityType, eid, revisionID, authPass) {

  return new Promise(function (resolve, reject) {

    iris.modules.revisions.globals.getRevision(entityType, eid, revisionID, authPass).then(function (revision) {

      iris.invokeHook("hook_entity_edit", authPass, null, revision.entity).then(function (success) {

        resolve(success);

      }, function (fail) {

        reject(fail);

      })

    }, function (fail) {

      reject(fail);

    })

  })

};

iris.modules.revisions.registerHook("hook_form_render__revision_revert", 0, function (thisHook, data) {

  thisHook.context.params;

  data.schema.entityType = {
    type: "hidden",
    default: thisHook.context.params.entityType
  }

  data.schema.eid = {
    type: "hidden",
    default: thisHook.context.params.eid
  }

  data.schema.revision = {
    type: "hidden",
    default: thisHook.context.params.revision
  }

  thisHook.pass(data);

})

iris.modules.revisions.registerHook("hook_form_submit__revision_revert", 0, function (thisHook, data) {

  iris.modules.revisions.globals.revertRevision(thisHook.context.params.entityType, thisHook.context.params.eid, thisHook.context.params.revision, thisHook.authPass).then(function (success) {

    iris.message(thisHook.authPass.userid, "Revision reverted", "info");

    thisHook.pass(data);

  }, function (fail) {

    thisHook.fail(fail);

  });

});

iris.route.get("/revisions/:entityType/:eid/:revision/revert", function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["revision_revert"], ['admin_wrapper'], {
    revision: req.params.revision,
    entityType: req.params.entityType,
    eid: req.params.eid
  }, req.authPass).then(function (html) {

    res.send(html);

  });

});
