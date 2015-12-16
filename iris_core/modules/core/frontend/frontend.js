iris.registerModule("frontend");

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

// Template Registry. Contains arrays of directories to look for templates in.

iris.modules.frontend.globals.templateRegistry = {
  theme: [iris.sitePath + "/templates"],
  external: []
};

// Add theme folders from modules to external list

process.on("dbReady", function () {

  Object.keys(iris.modules).forEach(function (moduleName) {

    iris.modules.frontend.globals.templateRegistry.external.push(iris.modules[moduleName].path + '/templates');

  })

});

var path = require("path");

if (iris.config.theme) {

  var themePath = path.resolve(iris.sitePath + '/../../' + iris.config.theme);

  try {

    // Theme static setup

    fs.readdirSync(themePath);

    iris.app.use("/static", express.static(themePath + '/static'));

    iris.modules.frontend.globals.templateRegistry.theme.push(themePath + "/templates");

    fs.readFile(themePath + "/theme.json", function (err, file) {

      if (err) {

        fs.writeFileSync(themePath + "/theme.json", '{}', 'utf8');

        iris.log("info", "Couldn't find theme.json file, creating one");

      }

    });

  } catch (e) {

    throw "Could not load theme";

  }

}

// Function for returning a parsed HTML template for an entity, including sub templates

iris.modules.frontend.globals.getTemplate = function (entity, authPass, optionalContext) {

  var req = optionalContext.req;

  if (entity.toObject) {

    entity = entity.toObject();

  }

  //  var context = Object.assign(entity, optionalContext);

  if (!entity.eid) {

    entity.eid = entity._id;

  }

  if (!optionalContext) {

    optionalContext = {};

  }

  context = optionalContext;

  //  context.current = entity;

  return new Promise(function (yes, no) {

    // Check if the current person can access the entity itself

    iris.hook("hook_entity_view", req.authPass, null, entity).then(function (viewChecked) {

      if (!viewChecked) {

        iris.hook("hook_display_error_page", req.authPass, {
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

      iris.hook("hook_entity_view_" + entity.entityType, thisHook.authPass, null, entity).then(function (validated) {

        if (validated) {

          context.current = validated;
          renderTemplate();

        }

      }, function (fail) {

        if (fail === "No such hook exists") {

          context.current = viewChecked;
          renderTemplate();

        } else {

          // Entity is never set if it fails

        }

      })

    }, function (fail) {

      no(fail);

    });

    var renderTemplate = function () {

      iris.modules.frontend.globals.parseTemplateFile([entity.entityType, entity.eid], ["html", entity.entityType, entity.eid], context, authPass, context.req).then(function (success) {

        yes(success);

      }, function (fail) {

        iris.log("error", fail);

        no("Could not parse template");

      });

    };

  });

};

//Function for finding most specific matching template

var findTemplate = function (paths, extension) {

  if (!extension) {

    extension = "html";

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

    iris.modules.frontend.globals.templateRegistry.theme.forEach(function (directory) {

      try {
        var files = fs.readdirSync(directory);

        var result = lookForTemplate(files, args);

        if (result) {

          found.push({
            directory: directory,
            filename: result,
            rank: 1
          });

        }

      } catch (e) {

      }

    });

    iris.modules.frontend.globals.templateRegistry.external.forEach(function (directory) {

      try {
        var files = fs.readdirSync(directory)
      } catch (e) {

        return false;

      };

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

      if (Object.keys(iris.dbCollections).indexOf(paths[0]) !== -1) {

        iris.modules.frontend.globals.findTemplate(["entity"], "html").then(function (html) {

          yes(html);

        }, function (fail) {

          no(false);

        })

      } else {

        no(false);

      }

    }

  });

};

iris.modules.frontend.globals.findTemplate = findTemplate;

// Helper function for parsing blocks

iris.modules.frontend.globals.parseBlock = function (prefix, html, action) {

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

          if (content) {

            html = html.split("[[[" + prefix + " " + choice + "]]]").join(content);

          }

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

        iris.hook("hook_frontend_template_parse", authPass, {
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

        if (!entity.eid) {

          entity.eid = entity._id;

        }

        findTemplate([element, entity.entityType, entity.eid]).then(function (subTemplate) {

          parseTemplate(subTemplate, authPass, context).then(function (contents) {

            output = output.split("[[[file " + element + "]]]").join(contents.html);

            counter -= 1;

            if (counter === 0) {

              iris.hook("hook_frontend_template_context", authPass, output, context.custom).then(function (newContext) {

                complete(output);

              });

            }

          });

        }, function (fail) {

          iris.log("error", "Cannot find template " + element);

          // Remove template if it can't be found

          output = output.split("[[[file " + element + "]]]").join("");

          parseTemplate(output, authPass, context).then(function (contents) {

            complete(contents);

          });

        });

      });

    } else {

      iris.hook("hook_frontend_template_context", authPass, output, context.custom).then(function (newContext) {

        complete(output);

      }, function (fail) {

        iris.log("error", fail);

      });

    }

  });

};

iris.modules.frontend.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

iris.modules.frontend.registerHook("hook_frontend_template_context", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

iris.modules.frontend.globals.parseTemplate = parseTemplate;

iris.app.use(function (req, res, next) {

  if (req.method !== "GET") {

    next();
    return false;

  }

  // Lookup literal entity from path

  var splitUrl = req.url.split('/');

  if (splitUrl && splitUrl.length === 3 && Object.keys(iris.dbCollections).indexOf(splitUrl[1]) !== -1) {

    for (var path in iris.modules.paths.globals.entityPaths) {

      if (iris.modules.paths.globals.entityPaths[path].eid && iris.modules.paths.globals.entityPaths[path].eid.toString() === splitUrl[2] && iris.modules.paths.globals.entityPaths[path].entityType === splitUrl[1]) {

        res.redirect(path)

        return false;

      }

    }

    iris.hook("hook_entity_fetch", req.authPass, null, {
      queryList: [{
        entities: [splitUrl[1]],
        queries: [{
          field: 'eid',
          comparison: 'IS',
          compare: splitUrl[2]
        }]
      }]
    }).then(function (result) {

      if (result && result[0]) {

        iris.modules.frontend.globals.getTemplate(result[0], req.authPass, {
          req: req
        }).then(function (html) {

          res.send(html);

          next();

        }, function (fail) {

          iris.hook("hook_display_error_page", req.authPass, {
            error: 500,
            req: req
          }).then(function (success) {

            res.send(success);

          }, function (fail) {

            res.send("500");

          });

        });

      } else {

        next();

      }

    }, function (error) {

      console.log(error);

      next();

    });

  } else {

    next();

  }

});

iris.modules.frontend.registerHook("hook_display_error_page", 0, function (thisHook, data) {

  var isFront = false;

  if (thisHook.const.req.url === '/' || thisHook.const.req.url === '/force_front_404') {

    isFront = true;

  }

  iris.modules.frontend.globals.parseTemplateFile([thisHook.const.error], null, {
    front: isFront
  }, thisHook.const.req.authPass, thisHook.const.req).then(function (success) {

    thisHook.finish(true, success)

  }, function (fail) {

    thisHook.finish(true, "<h1>Error " + thisHook.const.error + "</h1>");

  });

});

// Handlebars templating

iris.modules.frontend.registerHook("hook_frontend_template", 1, function (thisHook, data) {

  var Handlebars = require('handlebars');

  try {

    data.html = Handlebars.compile(data.html)(data.vars);

    // Run through parse template again to see if any new templates can be loaded.

    if (data.html.indexOf("[[[") !== -1) {

      iris.modules.frontend.globals.parseTemplate(data.html, thisHook.authPass, data.vars).then(function (success) {

        success.html = Handlebars.compile(success.html)(success.variables);

        success.html = success.html.split("[[[").join("<!--[[[").split("]]]").join("]]]-->");

        thisHook.finish(true, success);

      });

    } else {

      thisHook.finish(true, data);

    }


  } catch (e) {

    thisHook.finish(false, e);

  }

});

// Helper function for parsing a template from a file with parameters

iris.modules.frontend.globals.parseTemplateFile = function (templateName, wrapperTemplateName, parameters, authPass, req) {

  return new Promise(function (yes, no) {

    var parseTemplateFile = function (currentTemplateName, parameters, callback) {

      iris.modules.frontend.globals.findTemplate(currentTemplateName).then(function (template) {

        iris.modules.frontend.globals.parseTemplate(template, authPass || "root", parameters).then(function (success) {

            // Add wrapper paramaters for filename

            success.html = "<!-- " + currentTemplateName + "-->" + "\n" + success.html;

            callback(success);

          },
          function (fail) {

            no(fail);

          });


      }, function (fail) {

        no(fail);

      });

    };

    if (wrapperTemplateName) {

      parseTemplateFile(wrapperTemplateName, parameters, function (wrapperOutput) {

        parseTemplateFile(templateName, wrapperOutput.variables, function (innerOutput) {

          var output = wrapperOutput.html.split("[[[MAINCONTENT]]]").join(innerOutput.html);

          iris.hook("hook_frontend_template", authPass || "root", {
            html: output,
            vars: innerOutput.variables
          }, {
            html: output,
            vars: innerOutput.variables
          }).then(function (output) {

            yes(output.html);

          }, function (fail) {

            no(fail);

          })

        })

      })

    } else {

      parseTemplateFile(templateName, parameters, function (output) {

        iris.hook("hook_frontend_template", authPass || "root", {
          html: output.html,
          vars: output.variables
        }, {
          html: output.html,
          vars: output.variables
        }).then(function (output) {

          yes(output.html);

        }, function (fail) {

          no(fail);

        })

      })

    }

  });

}
