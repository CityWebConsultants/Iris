iris.registerModule("nedb", __dirname);

var nedb = require('nedb');

var collections = {};
var eidCounts;

iris.modules.nedb.registerHook("hook_db_connect__nedb", 0, function (thisHook, data) {

  thisHook.pass(data);

  // Make entity counts database

  eidCounts = new nedb({
    filename: iris.sitePath + '/nedb/eidCounts.nedb',
    autoload: true
  });

});

iris.modules.nedb.registerHook("hook_db_schema__nedb", 0, function (thisHook, data) {

  var name = thisHook.context.schema;

  collections[name] = new nedb({
    filename: iris.sitePath + '/nedb/' + name + ".nedb",
    autoload: true
  });

  thisHook.pass(data);

});

iris.modules.nedb.registerHook("hook_db_fetch__nedb", 0, function (thisHook, data) {

  if (!thisHook.context.query["$and"]) {

    thisHook.context.query = {};

  }
  collections[thisHook.context.entityType].find(thisHook.context.query).sort(thisHook.context.sort).skip(thisHook.context.skip).limit(thisHook.context.limit).exec(function (err, doc) {

    data = doc;

    if (err) {

      return thisHook.fail(err);

    } else {

      thisHook.pass(data);

    }

  });

});

iris.modules.nedb.registerHook("hook_db_createEntity__nedb", 0, function (thisHook, data) {

  // Get new entity eid

  var update = {}

  eidCounts.update({
    entityType: thisHook.context.entityType
  }, {
    $inc: {
      eidCount: 1
    }
  }, {
    upsert: true,
    returnUpdatedDocs: true,
    multi: false
  }, function (err, num, doc) {

    var entity = thisHook.context.fields;
    entity.eid = doc.eidCount;

    collections[thisHook.context.entityType].insert([thisHook.context.fields], function (err, doc) {

      if (err) {

        return thisHook.fail(err);

      }

      thisHook.pass(doc[0]);

    });

  });

});

iris.modules.nedb.registerHook("hook_db_updateEntity__nedb", 0, function (thisHook, data) {

  collections[thisHook.context.entityType].update({
    eid: thisHook.context.eid
  }, {
    $set: thisHook.context.update
  }, {
    returnUpdatedDocs: true,
    multi: false
  }, function (err, number, doc) {

    if (err) {

      return thisHook.fail(err);

    }

    thisHook.pass(doc);

  });

});

iris.modules.nedb.registerHook("hook_db_deleteEntity__nedb", 0, function (thisHook, data) {

  collections[thisHook.context.entityType].remove({
    eid: parseInt(thisHook.context.eid)
  }, {}, function (err, data) {

    if (err) {

      return thisHook.fail(data);

    } else {

      thisHook.pass(data);

    }

  })

})

// Delete schema

var fs = require("fs");

iris.modules.nedb.registerHook("hook_db_deleteSchema__nedb", 0, function (thisHook, data) {

  delete collections[thisHook.context.schema];

  fs.unlink(iris.sitePath + '/nedb/' + thisHook.context.schema + ".nedb", function (err, data) {

    eidCounts.remove({
      entityType: thisHook.context.schema
    }, {}, function (err, data) {

      if (err) {

        return thisHook.fail(data);

      } else {

        thisHook.pass(data);
      }

    })

  })

});
