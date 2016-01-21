var path = require('path');

iris.app.get("/admin/api/entitytypes", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    res.send(Object.keys(iris.dbCollections));

  } else {

    res.redirect("/admin");

  }

});

iris.modules.admin_ui.globals.prepareEntitylist = function (type, callback) {

  // Query for all entities of this type

  if (iris.dbCollections[type]) {

    var fields = [];

    iris.dbCollections[type].find({}, function (err, doc) {

      if (!err) {

        callback({
          entities: doc,
          fields: fields
        });

      } else {

        iris.log("error", "Database error while fetching entities");

        callback({});

      }

    })

  } else {

    iris.log("error", "Request for invalid entity type");

    callback({});

  }

}
