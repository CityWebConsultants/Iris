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
