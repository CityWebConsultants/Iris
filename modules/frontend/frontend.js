C.registerModule("frontend");

var fs = require('fs');
var express = require('express');

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code != 'EEXIST') throw e;
  }
}

mkdirSync(C.sitePath + "/" + "configurations/frontend/templates");
mkdirSync(C.sitePath + "/" + "configurations/frontend/static");

C.app.use("/static", express.static(C.sitePath + "/" + "configurations/frontend/static"));

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

        try {

          var page = fs.readFileSync(C.sitePath + "/" + "configurations/frontend/templates/" + data.entity.type + "_" + data.entity.id + ".html", "utf8");

        } catch (e) {

          try {

            var page = fs.readFileSync(C.sitePath + "/" + "configurations/frontend/templates/" + data.entity.type + ".html", "utf8");

          } catch (e) {

            next();
            return false;

          }

        }
        //Replace page variables so content can be loaded

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
