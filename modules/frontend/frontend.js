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

//Function for finding most specific matching template

var findTemplate = function () {

  //Get files in template folder

  var templates = fs.readdirSync(C.sitePath + "/" + "configurations/frontend/templates");

  //Loop over arguments

  var args = Array.prototype.slice.call(arguments);

  var i;

  for (i = 0; i <= args.length + 1; i += 1) {

    var lookingFor = args.join("_") + ".html";

    if (templates.indexOf(lookingFor) !== -1) {

      return lookingFor;

    };

    args.splice(args.length - 1, 1);

  };

  return false;

}

var parseTemplate = function (path, callback, swapVariables) {

  var output = fs.readFileSync(C.sitePath + "/" + "configurations/frontend/templates/" + path, "utf-8");

  if (swapVariables) {

    swapVariables.forEach(function (element) {

      output = output.split("(((" + element[0] + ")))").join(element[1]);

    });

  };

  //Get any embeded templates inside the template file

  var embeds = output.match(/\(\(\(\s*[\w\.]+\s*\)\)\)/g);

  if (embeds) {

    var embeds = embeds.map(function (x) {
      return x.match(/[\w\.]+/)[0];
    });

    embeds.forEach(function (element) {

      var path = element.split("_");

      var subTemplate = findTemplate.apply(this, path);

      if (subTemplate) {

        parseTemplate(subTemplate, function (contents) {

          output = output.split("(((" + element + ")))").join(contents);

        }, swapVariables);

      };

    });

  }

  callback(output);

};

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

    //Entity exists

    if (data.entity) {

      var template = findTemplate(data.entity.type, data.entity.id);

      parseTemplate(template, function (inner) {

        var wrapperTemplate = findTemplate("html", data.entity.type, data.entity.id);

        if (wrapperTemplate) {

          parseTemplate(wrapperTemplate, function (wrapper) {

            wrapper = wrapper.split("(((MAINCONTENT)))").join(inner);

            res.send(wrapper);

          }, [["type", data.entity.type], ["id", data.entity.id]]);

        } else {

          res.send(inner);

        }

      }, [["type", data.entity.type], ["id", data.entity.id]]);

    } else {

      //Entity doesn't exist

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
