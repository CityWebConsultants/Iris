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

// Template Registry. Contains arrays of directories to look for templates in.
CM.frontend.globals.templateRegistry = {
  theme: [C.sitePath + "/" + "configurations/frontend/templates"],
  external: [__dirname + '/templates']
};

//Function for finding most specific matching template

var findTemplate = function () {

  var args = Array.prototype.slice.call(arguments);

  // Compare top-level arguments against given files

  var lookForTemplate = function (files, args) {

    var searchArgs = JSON.parse(JSON.stringify(args));

    //Loop over arguments

    var i;

    for (i = 0; i <= searchArgs.length + 1; i += 1) {

      var lookingFor = searchArgs.join("_") + ".html";

      if (files.indexOf(lookingFor) !== -1) {

        return lookingFor;

      }

      searchArgs.splice(searchArgs.length - 1, 1);

    };

    return false;

  };

  // Get files in template folders

  // This could be cached or otherwise done on startup, but we want to be able to edit templates
  // without restarting or clearing caches.

  var found = [];

  CM.frontend.globals.templateRegistry.theme.forEach(function (directory) {

    var files = fs.readdirSync(directory);

    var result = lookForTemplate(files, args);

    if (result) {

      found.push({directory: directory, filename: result, rank: 1});

    }

  });

  CM.frontend.globals.templateRegistry.external.forEach(function (directory) {

    var files = fs.readdirSync(directory);

    var result = lookForTemplate(files, args);

    if (result) {

      found.push({directory: directory, filename: result, rank: 0});

    }

  });

// return path or false

  // Sort so that longest and hence most specific filenames are at the top
  var sortLength = function (a, b) {

    if (a.filename.split('_').length > b.filename.split('_').length) {
      return -1;
    }

    if (a.filename.split('_').length < b.filename.split('_').length) {
      return 1;
    }

    return 0;

  };

  found.sort(sortLength);

  // Filter out filenames less specific than the top
  found = found.filter(function (value) {

    if (value.filename.split('_').length < found[0].filename.split('_').length) {
      return false;
    } else {
      return true;
    }

  });

  // Sort by rank
    var sortRank = function (a, b) {

    if (a.rank > b.rank) {
      return -1;
    }

    if (a.rank < b.rank) {
      return 1;
    }

    return 0;

  };

  found.sort(sortRank);

  if (found[0]) {
    return found[0].directory + '/' + found[0].filename;
  } else {
    return false;
  }

};

var parseTemplate = function (path, callback) {

  var output = fs.readFileSync(path, "utf-8");

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

      var template = findTemplate(data.entity.type, data.entity.id);

      parseTemplate(template, function (inner) {

        var wrapperTemplate = findTemplate("html", data.entity.type, data.entity.id);

        if (wrapperTemplate) {

          parseTemplate(wrapperTemplate, function (wrapper) {

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

                    res.send(success.html);

                  }, function (fail) {

                    if (fail === "No such hook exists") {

                      res.send(wrapper);

                    }

                    res.respond(500, "Could not render template");

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
