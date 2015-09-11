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

var parseTemplate = function (path, callback) {

  var output = fs.readFileSync(C.sitePath + "/" + "configurations/frontend/templates/" + path, "utf-8");

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

        });

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
            type: type,
            fields: doc,

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

              wrapper = wrapper.split("[[MAINCONTENT]]").join(inner);

              var entityFetcher = wrapper.match(/<!---\[preload(.|\n)*?endpreload]--->/g);

              var templateVars = {};

              if (entityFetcher) {

                entityFetcher.forEach(function (element, index) {

                  var current = entityFetcher[index];

                  current = current.substr(13);
                  current = current.substr(0, current.length - 15);

                  try {

                    current = JSON.parse(current);

                    if (current.queries && current.queries.length) {

                      current.queries.forEach(function (query, index) {

                        // Split query into sub sections

                        var query = query.split("|");

                        // Skip empty queries

                        if (!query[2]) {

                          current.queries[index] = undefined;
                          return false;

                        }

                        try {

                          JSON.parse(query[2]);

                        } catch (e) {

                          console.log(query[2]);
                          console.log(e);

                          current.queries[index] = undefined;
                          return false;

                        };

                        current.queries[index] = ({

                          field: query[0],
                          comparison: query[1],
                          compare: JSON.parse(query[2])

                        });

                      });

                    }

                    // Catch JSON parse error
                  } catch (e) {
                    console.log(e);
                    current = undefined;
                  }

                  // Apply changes
                  entityFetcher[index] = current;

                  if (current && current.context) {
                    templateVars[current.context] = current;
                  }

                });

              }

              var promises = [];

              entityFetcher.forEach(function (fetcher) {

                promises.push(

                  C.promise(function (yes, no, data) {

                    C.hook("hook_entity_fetch", fetcher, req.authPass).then(function (result) {

                      templateVars[fetcher.context].result = result;

                      yes();

                    }, function (error) {

                      console.log(error);

                      no();

                    });

                  })

                );

              });

              C.promiseChain(promises, function (success) {

                var fields = data.entity.fields;

                data = {
                  html: wrapper,
                  vars: templateVars
                };

                data.vars.current = fields;

                C.hook("hook_frontend_template", data, req.authPass).then(function (success) {

                  res.send(success.html);

                }, function (fail) {

                  if (fail === "No such hook exists") {

                    res.send(wrapper);

                  }

                  res.respond(500, "Could not render template");

                });

              }, function (fail) {

                console.log(fail);

              });

            });

        } else {

          res.send(inner);

        }

      });

    } else {

      // Entity doesn't exist

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

CM.frontend.registerHook("hook_frontend_template", 0, function (thisHook, data) {

  var Mustache = require('mustache');

  try {

    data.html = Mustache.render(data.html, data.vars);

    thisHook.finish(true, data);

  } catch (e) {

    thisHook.finish(false, "Mustache rendering failed");

  }

});
