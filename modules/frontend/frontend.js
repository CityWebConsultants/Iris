C.registerModule("frontend");

C.app.use(function (req, res, next) {

  //Get all entity types

  var entityTypes = Object.keys(C.dbCollections);

  var promises = [];

  entityTypes.forEach(function (type) {

    promises.push(C.promise(function (data, yes, no) {

      C.dbCollections[type].findOne({
        'path': req.url
      }, function (err, doc) {

        if (doc) {

          data.entity = {

            id: doc._id,
            type: type

          }

        }

        yes(data);

      });

    }));

  });

  var success = function (data) {

    if (data.entity) {

      try {

        var fs = require("fs");

        var page = fs.readFileSync(C.sitePath + "/" + "configurations/frontend/" + data.entity.type + ".html", "utf8");

        page = page.split("<<entityType>>").join(data.entity.type);
        page = page.split("<<entityID>>").join(data.entity.id);

        //Check if user can actually access page

        if (CM.auth.globals.checkPermissions(["can view any " + data.entity.type], req.authPass)) {

          res.send(page);

        } else {

          res.send("Access denied");

        }

      } catch (e) {

        console.log(e);

        next();

      }

    } else {

      next();

    }

  }

  var fail = function () {

    next();

  }

  C.promiseChain(promises, {
      id: null,
      url: req.url,
    },
    success,
    fail);

});
