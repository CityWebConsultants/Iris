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

//require("./regions.js");

/**
 *  Load theme
 */

CM.frontend.globals.themeConfig = function () {

  try {

    var themeConfig = require(C.sitePath + '/' + C.config.theme + '/theme.js');

    return themeConfig;

  } catch (e) {

    console.log("Could not read theme.js");

    return false;

  }

};

// Check that theme is sane
try {

  fs.readdirSync(C.sitePath + '/' + C.config.theme + "/templates");
  fs.readdirSync(C.sitePath + '/' + C.config.theme + "/static");

} catch (e) {

  console.log("Theme does not contain /templates or /static directories.");

}

// Template Registry. Contains arrays of directories to look for templates in.
CM.frontend.globals.templateRegistry = {
  theme: [C.sitePath + '/' + C.config.theme + "/templates"],
  external: [__dirname + '/templates']
};

// Theme static setup
C.app.use("/static", express.static(C.sitePath + '/' + C.config.theme + '/static'));

// Function for returning a parsed HTML template for an entity, including sub templates

CM.frontend.globals.getTemplate = function (entity, authPass, optionalContext) {

  return new Promise(function (yes, no) {

    var req = {};

    req.authPass = authPass;

    data = {};

    data.entity = {};

    data.entity.type = entity.entityType;
    data.entity.id = entity._id;
    data.entity.fields = entity;

    var template = findTemplate(data.entity.type, data.entity.id).then(function (data) {

      processTemplate(data);

    });

    var processTemplate = function (template) {

      var context = {
        entity: data.entity.fields,
        extras: optionalContext
      }

      parseTemplate(template, context, authPass, function (inner) {

        var wrapperTemplate = findTemplate("html", data.entity.type, data.entity.id).then(function (wrapperTemplate) {

          parseTemplate(wrapperTemplate, context, authPass, function (wrapper) {

            // Special [[MAINCONTENT]] variable loads in the relevant page template.

            wrapper = wrapper.split("[[[MAINCONTENT]]]").join(inner);

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

                      C.hook("hook_entity_fetch", req.authPass, null, {
                        queryList: [entity]
                      }).then(function (result) {

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
                  C.hook("hook_frontend_template", req.authPass, null, frontendData).then(function (success) {

                    yes(success.html);

                  }, function (fail) {

                    if (fail === "No such hook exists") {

                      yes(wrapper);

                    } else {

                      console.log("Could not render template");
                      no();

                    }

                  });

                };

                // Confirm that the `current` entity is viewable and pass to makeTemplate().

                C.hook("hook_entity_view", req.authPass, null, data.entity.fields).then(function (filtered) {

                  C.hook("hook_entity_view_" + filtered.entityType, req.authPass, null, filtered).then(function (filtered) {

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

        })

      });

    }

  });

};

//Function for finding most specific matching template

var findTemplate = function () {

  var args = Array.prototype.slice.call(arguments);

  return new Promise(function (yes, no) {

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

        found.push({
          directory: directory,
          filename: result,
          rank: 1
        });

      }

    });

    CM.frontend.globals.templateRegistry.external.forEach(function (directory) {

      var files = fs.readdirSync(directory);

      var result = lookForTemplate(files, args);

      if (result) {

        found.push({
          directory: directory,
          filename: result,
          rank: 0
        });

      }

    });

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
      fs.readFile(found[0].directory + '/' + found[0].filename, "utf-8", function (err, data) {

        yes(data);

      });
    } else {
      no(false);
    }

  });

};

// Helper function for parsing blocks

CM.frontend.globals.parseBlock = function (prefix, html, action) {

  return new Promise(function (yes, no) {

    var finder = new RegExp("\\[\\[\\[" + prefix + "\\s[\\w\\.\\-]+\\s*\\]\\]\\]", "g");

    var embeds = html.match(finder);

    if (embeds) {

      var embeds = embeds.map(function (x) {

        var internal = new RegExp(prefix + "\\s([\\w\\.\\-]+)");

        return x.match(internal)[1];

      });

      var counter = 0;

      var runthrough = function (choice) {

        var next = function (content) {

          html = html.split("[[[" + prefix + " " + choice + "]]]").join(content);

          if (counter === embeds.length) {

            runthrough(embeds[counter]);

            counter += 1;

          } else {

            yes(html);

          }

        };

        try {
          action(choice, next)
        } catch (e) {

          no(e);

        };

      };

      runthrough(embeds[counter]);

    } else {

      yes(html);

    }

  });

};

var parseTemplate = function (html, authpass, context, callback) {

  if (!context) {

    context = {};

  }

  var entity = context.entity;

  var output = html;

  //Get any embeded templates inside the template file

  var embeds = output.match(/\[\[\[file\s[\w\.\-]+\s*\]\]\]/g);

  if (embeds) {

    var embeds = embeds.map(function (x) {

      return x.match(/file\s([\w\.\-]+)/)[1];

    });

    var counter = embeds.length;

    embeds.forEach(function (element) {

      findTemplate(element, entity.entityType, entity._id).then(function (subTemplate) {

        parseTemplate(subTemplate, context, authpass, function (contents) {

          output = output.split("[[[file " + element + "]]]").join(contents);

          counter -= 1;

          if (counter === 0) {

            C.hook("hook_frontend_template_parse", authpass, context, output).then(function (output) {

              complete(output);

            });

          }

        });

      }, function (fail) {

        console.log("Cannot find template " + element);

        // Remove template if it can't be found

        output = output.split("[[[file " + element + "]]]").join("");

        parseTemplate(output, context, authpass, function (contents) {

          complete(contents);

        });

      });

    });

  } else {

    C.hook("hook_frontend_template_parse", authpass, context, output).then(function (output) {

      complete(output);

    });

  }

  var complete = function (output) {

    // Check for embedded templates

    var embeds = output.match(/\[\[\[file\s[\w\.\-]+\s*\]\]\]/g);

    if (embeds) {

      parseTemplate(output, context, authpass, function (output) {

        callback(output);

      })

    } else {

      callback(output);

    }

  };

};

CM.frontend.globals.parseTemplate = parseTemplate;

C.app.use(function (req, res, next) {

  if (req.method !== "GET") {

    next();

  }

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

      CM.frontend.globals.getTemplate(data.entity.fields, req.authPass, {
        req: req
      }).then(function (html) {

        res.send(html);

      }, function (fail) {

        next();

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

  thisHook.finish(true, data);

});
