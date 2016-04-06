/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

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
var path = require('path');

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

  });

});

// Load in file for setting active theme

require("./theme");

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

  var context = optionalContext;

  //  context.current = entity;

  return new Promise(function (yes, no) {

    // Check if the current person can access the entity itself

    iris.invokeHook("hook_entity_view", req.authPass, null, entity).then(function (viewChecked) {

      if (!viewChecked) {

        iris.invokeHook("hook_display_error_page", req.authPass, {
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

      iris.invokeHook("hook_entity_view_" + entity.entityType, req.authPass, null, entity).then(function (validated) {

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

      });

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
iris.modules.frontend.globals.findTemplate = function (paths, extension) {

  if (!extension) {

    extension = "html";

  }

  var args = paths;

  return new Promise(function (yes, no) {

    // Compare top-level arguments against given files

    var lookForTemplate = function (files, args) {

      var searchArgs = JSON.parse(JSON.stringify(args));

      //Loop over arguments

      var i;

      for (i = 0; i <= searchArgs.length + 1; i += 1) {

        var lookingFor = searchArgs.join("__") + "." + extension;

        // Loop over found files to check basename

        var found = false;

        files.forEach(function (fileName) {

          if (path.basename(fileName) === lookingFor) {

            found = fileName;

          }

        });

        if (found) {

          return found;

        }

        searchArgs.splice(searchArgs.length - 1, 1);

      }

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

      }

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

        });

      } else {

        no(false);

      }

    }

  });

};

// Function for finding embeds within a template, returns keyed list of embed types. Used for hook_frontend_embed__

var findEmbeds = function (text, leaveCurlies) {

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

  var start = getIndicesOf("[[[", text, false);

  var embeds = {};

  start.forEach(function (element, index) {

    var restOfString = text.substring(start[index], text.length);

    var embedEnd = restOfString.indexOf("]]]");

    var embed = restOfString.substring(3, embedEnd);

    // Get embed category

    var embedCat = embed.split(" ")[0];

    embed = embed.substring(embedCat.length + 1, embed.length);

    // Ignore embeds with curly braces

    if (leaveCurlies || embed.indexOf("{{") === -1) {

      if (!embeds[embedCat]) {

        embeds[embedCat] = [];

      }

      embeds[embedCat].push(embed);

    }

  });

  if (Object.keys(embeds).length) {

    return embeds;

  }

};

/**
 * @function parseTemplace
 * @memberof frontend
 *
 * @desc Parse a template recursively (to catch nested embeds). Internal function for Frontend. 
 * It recursively loops through finding all variable tags to be inserted, saves them to a global 
 * `context` array which is then present for rendering all templates. This means variables can be 
 * used across all templates when rendering.
 *
 * TODO: Now embeds have been moved out into hook_frontend_embed this could be simplified
 *
 * @param {string} html - HTML of template to process
 * @param {object} authPass - authPass of current user
 * @param {object} context - extra variables to pass to templating engine.
 *
 * There are other functions that are intended to make parsing templates easier.
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

      iris.invokeHook("hook_frontend_template_parse", authPass, {
        context: context
      }, {
        html: HTML,
        variables: allVariables
      }).then(function (parsedData) {

        if (parsedData.variables) {

          Object.keys(parsedData.variables).forEach(function (variable) {
            allVariables[variable] = parsedData.variables[variable];
          });

        }

        if (final) {

          pass({
            html: parsedData.html,
            variables: allVariables
          });

        } else {

          complete(parsedData.html, true);

        }

      });

    };

    if (!context) {

      context = {};

    }

    if (!context.entity) {

      context.entity = {};

    }

    var entity = context.entity;

    var output = html;

    complete(output);

  });

};

/**
 * @member hook_frontend_embed
 * @memberof frontend
 *
 * @desc Parse embedded templates
 *
 * Code for parsing [[[template ...]]] embeds
 */

iris.modules.frontend.registerHook("hook_frontend_embed__template", 0, function (thisHook, data) {

  // Split embed code by double underscores

  if (thisHook.context.embedID) {

    var searchArray = thisHook.context.embedID.split("__");

    // Get template

    iris.modules.frontend.globals.parseTemplateFile(searchArray, null, thisHook.context.vars, thisHook.authPass, thisHook.context.vars.req).then(function (success) {

      thisHook.pass(success);

    }, function (fail) {

      iris.log("error", "Tried to embed template " + thisHook.context.embedID + " but no matching template file found.");

      thisHook.pass("");

    });

  } else {

    thisHook.pass("");

  }

});

var parseEmbeds = function (html, variables, authPass) {

  return new Promise(function (pass, fail) {

    // Check for any embeds present in the code

    var embeds = findEmbeds(html);

    // Counter for checking all of the embeds have been parsed

    var embedCount = 0;
    var doneCount = 0;

    var finished = function () {


      doneCount += 1;

      if (doneCount === embedCount) {

        pass({
          html: html,
          variables: variables
        });

      }

    };

    if (embeds) {

      Object.keys(embeds).forEach(function (category) {

        embedCount += embeds[category].length;

        embeds[category].forEach(function (embed) {

          // Split parameters by , to get arguments

          var arguments = embed.split(","),
            embedID = arguments[0],
            embedOptions;

          if (arguments[1]) {

            try {

              arguments.shift();

              embedOptions = JSON.parse(arguments.join(","));

            } catch (e) {
              
              // Try comma seperated parameter approach

              embedOptions = [];

              embed.split(",").map(function (current) {

                embedOptions.push(current.trim())

              })
          
            }

          }

          iris.invokeHook("hook_frontend_embed__" + category, authPass, {
            vars: variables,
            embedID: embedID,
            embedOptions: embedOptions
          }).then(function (parsedEmbed) {

            var filler = '';
            if (embed && embed != '' || category == 'MAINCONTENT') {
              filler = ' ' + embed;
            }
            html = html.split("[[[" + category + filler + "]]]").join(parsedEmbed);

            finished();

          }, function (fail) {

            if (fail === "No such hook exists") {

              finished();

            } else {

              finished();

              if (fail) {
                iris.log("error", fail);
              }

            }

          });

        });

      });


    } else {

      pass({
        html: html,
        variables: variables
      });

    }

  });

};

/**
 * @member hook_frontend_template_parse
 * @memberof frontend
 *
 * @desc Parse frontend template
 *
 * Hook into the template parsing process using this. Useful for adding to the context variables
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

  }

  // Default tags

  data.variables.tags.headTags["iris_core"] = {
    type: "script",
    attributes: {
      "src": "/modules/frontend/iris_core.js"
    },
    rank: 0
  };

  if (iris.modules.frontend.globals.activeTheme) {
    data.variables["iris_theme"] = iris.modules.frontend.globals.activeTheme.name;
  }

  parseEmbeds(data.html, data.variables, thisHook.authPass).then(function (success) {

    thisHook.pass(success);

  }, function (fail) {

    thisHook.pass(fail);

  });

});

/**
 * Catch all callback which will be triggered for all callbacks that are not specifically defined.
 *
 * It will check for entity paths for urls like /[entity_type]/[entity_id] and redirect to their
 * pretty url if one is set.
 */
iris.app.use(function (req, res, next) {

  if (req.method !== "GET") {

    next();
    return false;

  }

  // Lookup entity type & id from path

  var splitUrl = req.url.split('/');

  if (splitUrl && splitUrl.length === 3 && Object.keys(iris.dbCollections).indexOf(splitUrl[1]) !== -1) {

    for (var path in iris.modules.paths.globals.entityPaths) {

      if (iris.modules.paths.globals.entityPaths[path].eid && iris.modules.paths.globals.entityPaths[path].eid.toString() === splitUrl[2] && iris.modules.paths.globals.entityPaths[path].entityType === splitUrl[1]) {

        res.redirect(path);

        return false;

      }

    }

    iris.invokeHook("hook_entity_fetch", req.authPass, null, {
      entities: [splitUrl[1]],
      queries: [{
        field: 'eid',
        operator: 'IS',
        value: splitUrl[2]
        }]
    }).then(function (result) {

      if (result && result[0]) {

        iris.modules.frontend.globals.getTemplate(result[0], req.authPass, {
          req: req
        }).then(function (html) {

          res.send(html);

          next();

        }, function (fail) {

          iris.invokeHook("hook_display_error_page", req.authPass, {
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
 * Expects thisHook.context.error to be an HTTP error code.
 *
 * @returns as data the HTML error page ready to be displayed to the user.
 */
iris.modules.frontend.registerHook("hook_display_error_page", 0, function (thisHook, data) {

  var isFront = false;

  if (thisHook.context.req.url === '/' || thisHook.context.req.url === '/force_front_404') {

    isFront = true;

  }

  iris.modules.frontend.globals.parseTemplateFile([thisHook.context.error], null, {
    front: isFront
  }, thisHook.context.req.authPass, thisHook.context.req).then(function (success) {

    thisHook.pass(success);

  }, function (fail) {

    thisHook.pass("<h1>Error " + thisHook.context.error + "</h1>");

  });

});

require("./handlebars_helpers");

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

  iris.invokeHook("hook_frontend_handlebars_extend", thisHook.authPass, {
    variables: data.vars
  }, Handlebars).then(function () {

    try {

      data.html = Handlebars.compile(data.html)(data.vars);

      // Run through parse template again to see if any new templates can be loaded.

      if (data.html.indexOf("[[[") !== -1) {

        var embeds = findEmbeds(data.html, true);

        // Loop over all embeds and compile out missing curlies

        if (embeds) {

          Object.keys(embeds).forEach(function (category) {

            embeds[category].forEach(function (embed) {

              if (embed.indexOf("{{") !== -1) {

                embed = "[[[" + category + " " + embed + "]]]";

                var compiled = Handlebars.compile(embed)({
                  stripCurlies: true
                });

                data.html = data.html.split(embed).join(compiled);


              }

            });

          });

        }

        parseTemplate(data.html, thisHook.authPass, data.vars).then(function (success) {

          success.variables.finalParse = true;

          success.html = Handlebars.compile(success.html)(success.variables);

          thisHook.pass(success);

        });

      } else {

        thisHook.pass(data);

      }

    } catch (e) {

      thisHook.pass(e);

    }

  }, function (fail) {

    thisHook.pass(fail);

  });

});

/**
 * @function unEscape
 * @memberof frontend
 *
 * @desc Function for unescaping escaped curly brackets used in handlebars.
 *
 * @returns un-escaped html.
 */

var unEscape = function (html) {

  if (typeof html === 'string') {
    html = html.split("\\{").join("{");
    html = html.split("\\}").join("}");
  }
  return html;

};

/*
 * @member hook_frontend_template
 * @memberof frontend
 *
 * @desc Function for inserting tags into templates (run last). 
 * TODO: Move to hook_frontend_embed
 *
 * @returns html where all tags are substituted with their respective markup.
 */

var insertTags = function (html, vars) {


  if (!html || !vars) {

    return html;

  }

  var embeds = findEmbeds(html);

  var tags;

  if (embeds && embeds.tags) {

    tags = embeds.tags;

  }

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

        if (typeof tag == "string") {

          output += "<" + tagName + ">" + tag + "</" + tagName + ">";

        } else {

          output += "<" + tag.type;

          if (tag.attributes) {

            Object.keys(tag.attributes).forEach(function (element) {

              output += " " + element + '=' + '"' + tag.attributes[element] + '"';

            });

          }

          if (tag.type === "script") {

            output += "></" + tag.type + ">";

          } else {

            output += "/>";

          }
        }
      });

      html = html.split("[[[tags " + innerTag + "]]]").join(output);

    }

  });

  return html;

};

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
iris.modules.frontend.globals.parseTemplateFile = function (templateName, wrapperTemplateName, parameters, authPass, req) {

  if (!parameters) {

    parameters = {};

  }

  if (req) {

    parameters.req = req;

  }

  return new Promise(function (yes, no) {

    var parseTemplateFile = function (currentTemplateName, parameters, callback) {

      iris.modules.frontend.globals.findTemplate(currentTemplateName).then(function (template) {

        parseTemplate(template, authPass || "root", parameters).then(function (success) {

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

          iris.invokeHook("hook_frontend_template", authPass || "root", {
            html: output,
            vars: innerOutput.variables
          }, {
            html: output,
            vars: innerOutput.variables
          }).then(function (output) {

            parseEmbeds(output.html, output.variables, authPass).then(function (success) {

              output.html = unEscape(success.html);

              output.html = output.html.split("[[[").join("<!--[[[").split("]]]").join("]]]-->");

              yes(output.html);

            }, function (fail) {

              no(fail);

            });

          }, function (fail) {

            no(fail);

          });

        });

      });

    } else {

      parseTemplateFile(templateName, parameters, function (output) {

        iris.invokeHook("hook_frontend_template", authPass || "root", {
          html: output.html,
          vars: output.variables
        }, {
          html: output.html,
          vars: output.variables
        }).then(function (output) {

          parseEmbeds(output.html, output.variables, authPass).then(function (success) {

            output.html = unEscape(success.html);

            output.html = output.html.split("[[[").join("<!--[[[").split("]]]").join("]]]-->");

            yes(output.html);

          }, function (fail) {

            no(fail);

          });

        }, function (fail) {

          no(fail);

        });

      });

    }

  });

};

require("./tags");
require("./tabs");
