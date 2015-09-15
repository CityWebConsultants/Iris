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

// Function for returning a parsed HTML template for an entity, including sub templates

CM.frontend.globals.getTemplate = function (entity, authPass, callback) {

  var req = {};

  req.authPass = authPass;

  data = {};

  data.entity = {};

  data.entity.type = entity.entityType;
  data.entity.id = entity._id;
  data.entity.fields = entity;

  var template = findTemplate(data.entity.type, data.entity.id);

  parseTemplate(template, data.entity.fields, function (inner) {

    var wrapperTemplate = findTemplate("html", data.entity.type, data.entity.id);

    if (wrapperTemplate) {

      parseTemplate(wrapperTemplate, data.entity.fields, function (wrapper) {

        // Special [[MAINCONTENT]] variable loads in the relevant page template.
        wrapper = wrapper.split("[[MAINCONTENT]]").join(inner);

        var makePreloadQueries = function () {

          var cheerio = require('cheerio'),
            $ = cheerio.load(wrapper);

          var entitiesToFetch = {};
          var templateVars = {};

          /**
           *  Use Cheerio to get calls for entities from the page.
           */
          var entitiesFromPage = function () {

            $('[data-preload-as]').each(function (index, element) {

              var preloadAs = $(this).attr('data-preload-as');
              var entities = $(this).attr('data-entities');
              var queries = $(this).attr('data-queries');
              var limit = $(this).attr('data-limit');
              var skip = $(this).attr('data-skip');
              var sort = $(this).attr('data-sort');

              if (preloadAs && entities) {

                entitiesToFetch[preloadAs] = {
                  entities: [entities],
                  queries: queries,
                  limit: limit,
                  skip: skip,
                  sort: sort,
                };

              }

            });

          };
          entitiesFromPage();

          /**
           *  Parse JSON and split queries from string into object.
           */
          var prepareQueries = function () {

            for (var entity in entitiesToFetch) {

              var entity = entitiesToFetch[entity];

              // Process sort
              try {

                entity.sort = JSON.parse(entity.sort);

              } catch (e) {

                entity.sort = undefined;

              }

              // Process queries
              try {

                if (entity.queries) {

                  entity.queries = entity.queries.split(',');

                }

                if (entity.queries && entity.queries.length) {

                  entity.queries.forEach(function (query, index) {

                    // Split query into sub sections

                    var query = query.split("|");

                    // Skip empty queries

                    if (!query[2]) {

                      entity.queries[index] = undefined;
                      return false;

                    }

                    try {

                      JSON.parse(query[2]);

                    } catch (e) {

                      console.log(query[2]);
                      console.log(e);

                      entity.queries[index] = undefined;
                      return false;

                    };

                    entity.queries[index] = ({

                      field: query[0],
                      comparison: query[1],
                      compare: JSON.parse(query[2])

                    });

                  });

                }

                // Catch JSON parse error
              } catch (e) {
                console.log(e);
                entity = undefined;
              }

            }

          };
          prepareQueries();

          var promises = [];

          /**
           *  Create array of promises that each run hook_entity_fetch on a query.
           */
          var makeQueryPromises = function () {

            for (var entity in entitiesToFetch) {

              var key = entity;
              entity = entitiesToFetch[entity];

              promises.push(

                C.promise(function (yes, no, data) {

                  C.hook("hook_entity_fetch", {
                    queryList: [entity]
                  }, req.authPass).then(function (result) {

                    templateVars[key] = result;

                    yes();

                  }, function (error) {

                    console.log(error);

                    no();

                  });

                })

              );

            }

          };
          makeQueryPromises();

          // If no queries, make a default promise
          if (Object.keys(entitiesToFetch).length === 0) {

            promises = [
                C.promise(function (yes, no, data) {

                yes();

              })
              ];
          }

          C.promiseChain(promises, function (success) {

            // Prepare, for templating, the page HTML and fetched query variables
            var frontendData = {
              html: wrapper,
              vars: templateVars
            };

            // Pass frontentData to templating hook and send to client
            var makeTemplate = function () {

              // Pass to templating systems
              C.hook("hook_frontend_template", frontendData, req.authPass).then(function (success) {

                callback(success.html);

              }, function (fail) {

                if (fail === "No such hook exists") {

                  callback(wrapper);

                } else {

                  console.log("Could not render template");
                  callback(false);

                }

              });

            };

            // Confirm that the `current` entity is viewable and pass to makeTemplate().

            C.hook("hook_entity_view", data.entity.fields, req.authPass).then(function (filtered) {

              C.hook("hook_entity_view_" + filtered.entityType, filtered, req.authPass).then(function (filtered) {

                frontendData.vars.current = filtered;
                makeTemplate();

              }, function (fail) {

                if (fail === "No such hook exists") {

                  frontendData.vars.current = filtered;
                  makeTemplate();

                }

              });

            });

            // If the query promises fail
          }, function (fail) {

            console.log(fail);

          });

        };

        makePreloadQueries();

      });

    } else {

      // else no wrapperTemplate

      res.send(inner);

    }

  });

};




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

var parseTemplate = function (path, entity, callback) {

  var output = fs.readFileSync(C.sitePath + "/" + "configurations/frontend/templates/" + path, "utf-8");

  //Get any embeded templates inside the template file

  var embeds = output.match(/\[\[\[\s*[\w\.]+\s*\]\]\]/g);

  if (embeds) {

    var embeds = embeds.map(function (x) {
      return x.match(/[\w\.]+/)[0];
    });

    embeds.forEach(function (element) {

      var path = [];

      path.push(element);
      path.push(entity.entityType);
      path.push(entity._id);

      var subTemplate = findTemplate.apply(this, path);

      if (subTemplate) {

        parseTemplate(subTemplate, entity, function (contents) {

          output = output.split("[[[" + element + "]]]").join(contents);

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

  // Query all entity types for an entity with the current 'path'

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

      CM.frontend.globals.getTemplate(data.entity.fields, req.authPass, function (html) {

        if (html) {

          res.send(html);

        } else {

          next();

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
