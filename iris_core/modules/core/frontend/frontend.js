/**
 * @file Hooks and functions for the templating and routing systems that make up the 
 * frontend module.
 */

/**
 * @namespace frontend
 */

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

/**
 * Template Registry. Contains arrays of directories to look for templates in.
 */
iris.modules.frontend.globals.templateRegistry = {
  external: [],
  theme: []
};

/**
 * Static folder in site's root directory.
 */

iris.app.use("/", express.static(iris.sitePath + '/static'));

/**
 * Add theme folders from modules to external list.
 */

process.on("dbReady", function () {

  Object.keys(iris.modules).reverse().forEach(function (moduleName) {

    iris.modules.frontend.globals.templateRegistry.external.push(iris.modules[moduleName].path + '/templates');

  })

});

var path = require("path");

/**
 * @function setActiveTheme
 * @memberof frontend
 *
 * @desc Sets the active name from the passed values.
 *
 * @param {string} themePath - path to the theme folder
 * @param {string} themeName - name of the active theme
 *
 * @returns error message if it fails.
 */
iris.modules.frontend.globals.setActiveTheme = function (themePath, themeName) {

  // Reset theme lookup registry

  iris.modules.frontend.globals.templateRegistry.theme = [];

  var result = {};

  try {

    var unmet = [];
    var loadedDeps = [];

    var themeInfo = JSON.parse(fs.readFileSync(iris.rootPath + themePath + '/' + themeName + '.iris.theme', "utf8"));

    // Make config into a variable accessible by other modules

    iris.modules.frontend.globals.activeTheme = {
      name: themeName,
      path: iris.rootPath + themePath
    }

    // Read themes this is dependent on

    var glob = require("glob");

    if (themeInfo.dependencies) {

      Object.keys(themeInfo.dependencies).forEach(function (dep) {

        var found = glob.sync("{" + iris.rootPath + "/iris_core/themes/" + dep + "/" + dep + ".iris.theme" + "," + iris.sitePath + "/themes/" + dep + "/" + dep + ".iris.theme" + "," + iris.rootPath + "/home/themes/" + dep + "/" + dep + ".iris.theme" + "}");

        if (!found.length) {

          unmet.push(dep);

        } else {

          found.forEach(function (loadedDep) {

            loadedDeps.push(loadedDep);

          })

        }

      })

    }

    // Push in theme templates to template lookup registry

    if (!unmet.length) {

      iris.modules.frontend.globals.templateRegistry.theme.push(iris.rootPath + themePath + "/templates");

      // Push in theme's static folder

      iris.app.use("/themes/" + themeName, express.static(iris.rootPath + themePath + "/static"));

      loadedDeps.forEach(function (loadedDep) {

        var depName = path.basename(loadedDep).replace(".iris.theme", "");

        iris.app.use("/themes/" + depName, express.static(path.dirname(loadedDep) + "/static"));

        iris.modules.frontend.globals.templateRegistry.theme.push(path.dirname(loadedDep) + "/templates");

      })

    } else {

      result.errors = "Active theme has unmet dependencies: " + unmet.join(",");

    }

  } catch (e) {

    iris.log("error", e);

    result.errors = "Something went wrong."

  }

  return result;

}

try {

  var themeFile = fs.readFileSync(iris.sitePath + "/active_theme.json", "utf8");

  try {

    var activeTheme = JSON.parse(themeFile);

    var setTheme = iris.modules.frontend.globals.setActiveTheme(activeTheme.path, activeTheme.name);

    if (setTheme.errors) {

      iris.log("error", "Could not enable " + activeTheme.name);
      iris.log("error", setTheme.errors);

    }

  } catch (e) {

    iris.log("error", e);

  }

} catch (e) {

  iris.log("info", "No theme enabled");

}

/**
 * @function getTemplate
 * @memberof frontend
 *
 * @desc Returns a parsed HTML template for an entity, including sub templates
 *
 * @param {object} entity - the entity to work from
 * @param {object} authPass - the current user's authPass (use "root" for full access)
 * @param {object} [optionalContext] - additional context to make available as a template variable
 *
 * @returns a promise which, if successful, has the parsed HTML template as its first argument.
 */
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

      iris.hook("hook_entity_view_" + entity.entityType, req.authPass, null, entity).then(function (validated) {

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

var glob = require("glob");

/**
 * @function findTemplate
 * @memberof frontend
 *
 * @desc Function for finding most specific matching template
 *
 * @param {string[]} paths - Paths to search for templates in
 * @param {extension} [string] - File extension to search for. Defaults to html.
 *
 * @returns promise which, if successful, takes the template HTML output as its first argument.
 */
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

        // Loop over found files to check basename

        var found = false;

        files.forEach(function (fileName) {

          if (path.basename(fileName) === lookingFor) {

            found = fileName;

          }

        })

        if (found) {

          return found;

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

        var files = glob.sync(directory + "/" + "**");

        var result = lookForTemplate(files, args);

        if (result) {

          found.push({
            filename: result,
            rank: 1
          });

        }

      } catch (e) {

      }

    });

    iris.modules.frontend.globals.templateRegistry.external.forEach(function (directory) {

      try {

        var files = glob.sync(directory + "/" + "**");

      } catch (e) {

        return false;

      };

      var result = lookForTemplate(files, args);

      if (result) {

        found.push({
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

      if (path.basename(value.filename).split('_').length < path.basename(found[0].filename).split('_').length) {
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
      fs.readFile(found[0].filename, "utf-8", function (err, data) {

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

/**
 * @function parseEmbed
 * @memberof frontend
 *
 * @desc Parse `embeds` in *template* _HTML_
 *
 * An 'embed' is a type of directive, embedded in HTML, of the form [[[prefix <data>]]].
 *
 * Embeds are intended to be replaced with code generated from the data provided.
 *
 * For example, the embed [[[form example]]] would render the form named 'example.'
 *
 * @param {string} prefix - the 'prefix' used to identify the embed type
 * @param {string} html - the HTML to process; that contains the embeds that need to be parsed
 * @param {function} action - callback to be run on each embed parsed
 *
 * @returns a promise which, if successful, takes the processed HTML as its first argument.
 */
iris.modules.frontend.globals.parseEmbed = function (prefix, html, action) {

  return new Promise(function (yes, no) {

    var embeds = getEmbeds(prefix, html);

    if (embeds) {

      //  Skip embed if it contains Handlebars parameters

      embeds = embeds.filter(function (embed) {

        return embed.indexOf("{{") === -1;

      })

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


/**
 * @function getEmbeds
 * @memberof frontend
 *
 * @desc Given some `text`, if will search for all instances of a given embed `type` and return 
 * an array of all such embeds. Embed types include form, menu, entity etc.
 *
 * @param {string} type - the type of embed to find, eg. form, menu
 * @param {string} text - the HTML to process; that contains the embeds that need to be parsed
 *
 * @returns an array of embeds found in this snippet of `type`
 */
var getEmbeds = function (type, text) {

  function getIndicesOf(searchStr, str, caseSensitive) {
    var startIndex = 0,
      searchStrLen = searchStr.length;
    var index, indices = [];
    if (!caseSensitive) {
      str = str.toLowerCase();
      searchStr = searchStr.toLowerCase();
    }
    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
      indices.push(index);
      startIndex = index + searchStrLen;
    }
    return indices;
  }

  var start = getIndicesOf("[[[" + type, text, false);

  var embeds = [];

  start.forEach(function (element, index) {

    var restOfString = text.substring(start[index], text.length);

    var embedEnd = restOfString.indexOf("]]]");

    embeds.push(restOfString.substring(3 + type.length + 1, embedEnd));

  })

  if (embeds.length) {
    return embeds;
  }

}

/**
 * @function parseTemplace
 * @memberof frontend
 *
 * @desc Parse a template recursively (to catch nested embeds). Internal function for Frontend. 
 * It recursively loops through finding all variable tags to be inserted, saves them to a global 
 * `context` array which is then present for rendering all templates. This means variables can be 
 * used across all templates when rendering.
 *
 * @param {string} html - HTML of template to process
 * @param {object} authPass - authPass of current user
 * @param {object} context - extra variables to pass to templating engine.
 *
 * There are other functions that are intended to make parsing templates easier.
 * @see parseEmbed
 * @see parseTemplateFile
 *
 * @returns a promise which, if successful, takes an object with properties 'html' and 'variables',
 * for the processed HTML and variables ready to pass to the templating engine, respectively.
 */

var merge = require("merge");

var parseTemplate = function (html, authPass, context) {

  return new Promise(function (pass, fail) {

    if (context) {

      var allVariables = context;

    } else {

      allVariables = {};

    }
    var complete = function (HTML, final) {

      // Check for embedded templates

      var embeds = getEmbeds("template", HTML);

      if (embeds) {

        parseTemplate(HTML, authPass, context).then(function (data) {

          if (data.variables) {

            allVariables = merge.recursive(false, allVariables, data.variables);

          };

          pass({
            html: data.html,
            variables: allVariables
          });

        }, function (fail) {


        })

      } else {

        iris.hook("hook_frontend_template_parse", authPass, {
          context: context
        }, {
          html: HTML,
          variables: allVariables
        }).then(function (parsedData) {

          if (parsedData.variables) {

            allVariables = merge.recursive(false, allVariables, parsedData.variables);

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

    var entity = context.entity;

    var output = html;

    //Get any embeded templates inside the template file

    var embeds = getEmbeds("template", output);

    if (embeds) {

      var counter = embeds.length;

      embeds.forEach(function (element) {

        if (!entity.eid) {

          entity.eid = entity._id;

        }

        var templates = element.split("_");

        if (entity.entityType) {

          templates.concat([entity.entityType, entity.eid]);

        }

        findTemplate(templates).then(function (subTemplate) {

          parseTemplate(subTemplate, authPass, context).then(function (contents) {

            output = output.split("[[[template " + element + "]]]").join(contents.html);

            counter -= 1;

            if (counter === 0) {

              complete(output);

            }

          });

        }, function (fail) {

          iris.log("error", "Cannot find template " + element);

          // Remove template if it can't be found

          output = output.split("[[[template " + element + "]]]").join("");

          parseTemplate(output, authPass, context).then(function (contents) {

            complete(contents.html);

          });

        });

      });

    } else {

      complete(output);

    }

  });

};

/**
 * @member hook_frontend_template_parse
 * @memberof frontend
 *
 * @desc Parse frontend template
 *
 * Hook into the template parsing process using this. Inside, one can run functions such as parseEmbed 
 * on the current state of the template.
 */
iris.modules.frontend.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  // Add tags to context if doesn't exist. Tags in this section should be in the format of an object with 
  // the properites: type (for the type of tag) and attributes (for a list of attributes) and a rank. 
  // headTags should be placed in the <head>, bodyTags in the <body> in your theme using [[[tags headTags]]] 
  // for example.

  if (!data.variables.tags) {

    data.variables.tags = {
      headTags: {},
      bodyTags: {},
    };

    // Default tags

    data.variables.tags.headTags["iris_core"] = {
      type: "script",
      attributes: {
        "src": "/modules/frontend/iris_core.js"
      },
      rank: 0
    }

  }

  thisHook.finish(true, data);

});


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
          operator: 'IS',
          value: splitUrl[2]
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

      next();

    });

  } else {

    next();

  }

});

/**
 * @member hook_display_error_page
 * @memberof frontend
 *
 * @desc Return a friendly error page to the user
 *
 * Expects thisHook.const.error to be an HTTP error code.
 *
 * @returns as data the HTML error page ready to be displayed to the user.
 */
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

/**
 * @member hook_frontend_handlebars_extend
 * @memberof frontend
 *
 * @desc Template engine processing - Handlebars extending
 *
 * Attaches partials and extensions onto handlebars templating engine
 *
 * @returns Handlebars object
 */

iris.modules.frontend.registerHook("hook_frontend_handlebars_extend", 0, function (thisHook, Handlebars) {

  // Handle for a user's messages

  Handlebars.registerHelper("iris_messages", function () {

    var messages = iris.readMessages(thisHook.authPass.userid);

    var output = "";

    if (messages.length) {

      output += "<ul class='iris-messages'>";

      messages.forEach(function (message) {

        output += "<li class='iris-message " + message.type + "'>" + message.message + "</li >";

      });

      output += "</ul>";

      iris.clearMessages(thisHook.authPass.userid);

    }

    return output;

  });

  thisHook.finish(true, Handlebars);

});

/**
 * @member hook_frontend_template
 * @memberof frontend
 *
 * @desc Template engine processing - Handlebars templating
 *
 * Parses data.html through a templating library: Handlebars in the default handler.
 *
 * @returns as data.html the parsed HTML template with template variables converted.
 */
iris.modules.frontend.registerHook("hook_frontend_template", 1, function (thisHook, data) {

  if (!data.vars) {

    data.vars = {};

  }

  var Handlebars = require('handlebars');

  iris.hook("hook_frontend_handlebars_extend", thisHook.authPass, {
    variables: data.vars
  }, Handlebars).then(function () {

    try {

      data.html = Handlebars.compile(data.html)(data.vars);

      // Run through parse template again to see if any new templates can be loaded.

      if (data.html.indexOf("[[[") !== -1) {

        iris.modules.frontend.globals.parseTemplate(data.html, thisHook.authPass, data.vars).then(function (success) {

          success.html = Handlebars.compile(success.html)(success.variables);

          thisHook.finish(true, success);

        });

      } else {

        thisHook.finish(true, data);

      }

    } catch (e) {

      thisHook.finish(false, e);

    }

  }, function (fail) {

    thisHook.finish(false, fail);

  })

});

// Function for unescaping escaped curly brackets used in handlebars

var unEscape = function (html) {

  if (typeof html === 'string') {
    html = html.split("\\{").join("{");
    html = html.split("\\}").join("}");
  }
  return html;

}


// Function for inserting tags into templates (run last). TODO: Make generic parseEmbed for embeds that run last. Same for Handlebars templates?

var insertTags = function (html, vars) {


  if (!html || !vars) {

    return html;

  }

  var tags = getEmbeds("tags", html);

  if (!tags) {

    return html;

  }

  tags.forEach(function (innerTag) {

    var tagName = innerTag.split(",")[0];

    var tagExclude = innerTag.split(",").slice(1, innerTag.split(",").length);

    tagExclude = tagExclude[0];

    if (tagExclude) {

      tagExclude = tagExclude.split(" ").join("").split("-");

    }

    if (vars.tags && vars.tags[tagName]) {

      var tagContainer = vars.tags[tagName];

      var output = "<!-- " + tagName + " -->";

      output += "\n";

      Object.keys(tagContainer).forEach(function (tagName) {

        if (tagExclude && tagExclude.indexOf(tagName) !== -1) {

          return false;

        }

        var tag = tagContainer[tagName];

        output += "\n";

        output += "<!-- " + tagName + " -->";

        output += "\n";

        output += "<" + tag.type;

        if (tag.attributes) {

          Object.keys(tag.attributes).forEach(function (element) {

            output += " " + element + '=' + '"' + tag.attributes[element] + '"';

          });

        };

        if (tag.type === "script") {

          output += "></" + tag.type + ">"

        } else {

          output += "/>";

        }

      })

      html = html.split("[[[tags " + innerTag + "]]]").join(output);

    }

  })

  return html;

}

/**
 * @function parseTemplateFile
 * @memberof frontend
 *
 * @desc Parse a template from a file with parameters
 *
 * Wraps and simplifies the process of loading a template file and parsing it.
 *
 * Allows for processing two templates: a wrapper and an inner template. Wrapper is optional.
 *
 * The inner template is inserted into the wrapper with the embed [[[MAINCONTENT]]].
 *
 * @param {string} templateName - file name of inner template file
 * @param {string} wrapperTemplateName - file name of wrapper template file
 * @param {object} parameters - extra variables to pass through to the templating system (via parseTemplate)
 * @param {object} authPass - the current user's authPass
 *
 * @returns a promise which, if successful, takes the output HTML as its first argument.
 */
iris.modules.frontend.globals.parseTemplateFile = function (templateName, wrapperTemplateName, parameters, authPass) {

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

            output.html = insertTags(output.html, innerOutput.variables);

            output.html = unEscape(output.html);

            output.html = output.html.split("[[[").join("<!--[[[").split("]]]").join("]]]-->");

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

          output.html = insertTags(output.html, output.variables);

          output.html = unEscape(output.html);

          output.html = output.html.split("[[[").join("<!--[[[").split("]]]").join("]]]-->");

          yes(output.html);

        }, function (fail) {

          no(fail);

        })

      })

    }

  });

}
