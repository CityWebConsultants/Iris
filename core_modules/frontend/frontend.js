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

/**
 *  Load theme
 */

CM.frontend.globals.themeConfig = function () {

  try {

    var themeConfig = require(C.sitePath + '/' + C.config.theme + '/theme.js');

    return themeConfig;

  } catch (e) {

    C.log("error", "Could not read theme.js");

    return false;

  }

};

// Check that theme is sane
try {

  fs.readdirSync(C.sitePath + '/' + C.config.theme + "/templates");
  fs.readdirSync(C.sitePath + '/' + C.config.theme + "/static");

} catch (e) {

  C.log("error", "Theme does not contain /templates or /static directories.");

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

  entity = entity.toObject();

  return new Promise(function (yes, no) {

    var req = {};

    req.authPass = authPass;

    data = {};

    data.entity = {};

    data.entity.type = entity.entityType;
    data.entity.id = entity._id;
    data.entity.fields = entity;

    if (!data.entity.fields.eId) {

      data.entity.fields.eId = data.entity._id;

    }

    var template = findTemplate([data.entity.type, data.entity.fields.eId]).then(function (data) {

      processTemplate(data);

    }, function (fail) {

      C.log("error", fail);

    });

    var processTemplate = function (template) {

      var context = {
        entity: data.entity.fields,
        extras: optionalContext
      }

      parseTemplate(template, authPass, context).then(function (inner) {

        inner = inner.html;

        var wrapperTemplate = findTemplate(["html", data.entity.type, data.entity.fields.eId]).then(function (wrapperTemplate) {

          parseTemplate(wrapperTemplate, authPass, context).then(function (wrapper) {

            variables = wrapper.variables;
            wrapper = wrapper.html;

            // Special [[MAINCONTENT]] variable loads in the relevant page template.

            wrapper = wrapper.split("[[[MAINCONTENT]]]").join(inner);

            // Check if the current person can access the entity itself

            C.hook("hook_entity_view", req.authPass, null, entity).then(function (viewChecked) {

              if (!viewChecked) {

                C.hook("hook_display_error_page", req.authPass, {
                  error: 403,
                  req: req
                }).then(function (success) {

                  yes(success);

                }, function (fail) {

                  yes("403");

                });

                return false;

              } else {

                entity = viewChecked;

              }

              C.hook("hook_entity_view_" + entity.entityType, thisHook.authPass, null, entity).then(function (validated) {

                if (validated) {
                  variables["current"] = validated;
                  renderTemplate();
                }

              }, function (fail) {

                if (fail === "No such hook exists") {

                  variables["current"] = viewChecked;
                  renderTemplate();

                } else {

                  // Don't set current.

                }

              })

            }, function (fail) {

              no(fail);

            });

            var renderTemplate = function () {

              var frontendData = {
                html: wrapper,
                vars: variables
              };

              // Pass to templating systems
              C.hook("hook_frontend_template", req.authPass, null, frontendData).then(function (success) {

                yes(success.html);

              }, function (fail) {

                if (fail === "No such hook exists") {

                  yes(wrapper);

                } else {

                  C.log("error", "Could not render template");
                  no();

                }

              });

            }

          });

        })

      }, function (fail) {

        C.log("error", fail);

      });

    }

  });

};

//Function for finding most specific matching template

var findTemplate = function (paths, extension) {

  if (!extension) {

    extension = C.config.templateExtension || "html";

  };

  var args = paths;

  return new Promise(function (yes, no) {

    // Compare top-level arguments against given files

    var lookForTemplate = function (files, args) {

      var searchArgs = JSON.parse(JSON.stringify(args));

      //Loop over arguments

      var i;

      for (i = 0; i <= searchArgs.length + 1; i += 1) {

        var lookingFor = searchArgs.join("_") + "." + extension;

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

      CM.frontend.globals.findTemplate(args, "html").then(function (html) {

        yes(html);

      }, function () {

        no(false);

      });


    }

  });

};

CM.frontend.globals.findTemplate = findTemplate;

// Helper function for parsing blocks

CM.frontend.globals.parseBlock = function (prefix, html, action) {

  return new Promise(function (yes, no) {

    var finder = new RegExp("\\[\\[\\[" + prefix + "\\s[^\\[\\]]+\\s*\\]\\]\\]", "g");

    var embeds = html.match(finder);

    if (embeds) {

      var embeds = embeds.map(function (x) {

        var internal = new RegExp(prefix + "\\s([^\\[\\]]+)");

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

      runthrough(embeds[counter].split(","));

    } else {

      yes(html);

    }

  });

};

var parseTemplate = function (html, authPass, context) {

  return new Promise(function (pass, fail) {

    if (context) {

      var allVariables = context;

    } else {

      allVariables = {};

    }
    var complete = function (HTML, final) {

      // Check for embedded templates

      var embeds = HTML.match(/\[\[\[file\s[\w\.\-]+\s*\]\]\]/g);

      if (embeds) {

        parseTemplate(HTML, authPass, context).then(function (data) {

          if (data.variables) {

            Object.keys(data.variables).forEach(function (variable) {

              allVariables[variable] = data.variables[variable];

            })

          };

          pass({
            html: data.html,
            variables: allVariables
          });

        })

      } else {

        C.hook("hook_frontend_template_parse", authPass, {
          context: context
        }, {
          html: HTML,
          variables: allVariables
        }).then(function (parsedData) {

          if (parsedData.variables) {

            Object.keys(parsedData.variables).forEach(function (variable) {

              allVariables[variable] = parsedData.variables[variable];

            })

          };

          if (final) {

            pass({
              html: parsedData.html,
              variables: allVariables
            });

          } else {

            complete(parsedData.html, true);

          }

        });

      }

    };

    if (!context) {

      context = {};

    }

    if (!context.entity) {

      context.entity = {};

    }

    if (!context.custom) {

      context.custom = {};

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

        if (!entity.eId) {

          entity.eId = entity._id;

        }

        findTemplate([element, entity.entityType, entity.eId]).then(function (subTemplate) {

          parseTemplate(subTemplate, authPass, context).then(function (contents) {

            output = output.split("[[[file " + element + "]]]").join(contents.html);

            counter -= 1;

            if (counter === 0) {

              C.hook("hook_frontend_template_context", authPass, output, context.custom).then(function (newContext) {

                complete(output);

              });

            }

          });

        }, function (fail) {

          C.log("error", "Cannot find template " + element);

          // Remove template if it can't be found

          output = output.split("[[[file " + element + "]]]").join("");

          parseTemplate(output, authPass, context).then(function (contents) {

            complete(contents);

          });

        });

      });

    } else {

      C.hook("hook_frontend_template_context", authPass, output, context.custom).then(function (newContext) {

        complete(output);

      }, function (fail) {

        C.log("error", fail);

      });

    }

  });

};

CM.frontend.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.frontend.registerHook("hook_frontend_template_context", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

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

CM.frontend.registerHook("hook_display_error_page", 0, function (thisHook, data) {

  CM.frontend.globals.findTemplate([thisHook.const.error], "html").then(function (html) {

    var isFront = false;

    if (thisHook.const.req.url === '/') {

      isFront = true;

    }

    CM.frontend.globals.parseTemplate(html, thisHook.const.req.authPass, {
      url: thisHook.const.req.url,
      front: isFront
    }).then(function (page) {

      C.hook("hook_frontend_template", thisHook.authPass, null, {
        html: page.html,
        vars: page.variables
      }).then(function (success) {

        thisHook.finish(true, success.html);

      }, function (fail) {

        C.log("error", fail);

        thisHook.finish(false, page.html);

      });

    });

  }, function (fail) {

    thisHook.finish(true, "<h1>Error " + thisHook.const.error + "</h1>");

  });

});

// Handlebars templating

CM.frontend.registerHook("hook_frontend_template", 1, function (thisHook, data) {

  var Handlebars = require('handlebars');

  try {

    data.html = Handlebars.compile(data.html)(data.vars);

    thisHook.finish(true, data);

  } catch (e) {

    thisHook.finish(false, e);

  }

});
