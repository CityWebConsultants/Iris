/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

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

  // Check route access

  Handlebars.registerHelper("iris_menu", function (item) {

    var route = iris.findRoute(item, "get");

    if (route && route.options && route.options.permissions) {

      if (iris.modules.auth.globals.checkPermissions(route.options.permissions, thisHook.authPass)) {

        return item;

      } else {

        return null;

      }

    } else {

      return item;

    }

  });

  /**
   * Test if variable equals a string.
   *
   * {{#if_eq this "some message"}}
   *   ...
   * {{else}}
   *   ...
   * {{/if_eq}}
   */

  Handlebars.registerHelper('if_eq', function (a, b, opts) {
    if (a == b) // Or === depending on your needs
      return opts.fn(this);
    else
      return opts.inverse(this);
  });

  // Parse JSON

  Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context);
  });

  // Handle for a user's messages

  Handlebars.registerHelper("iris_messages", function () {

    var messages = iris.readMessages(thisHook.authPass.userid);

    var output = "";

    if (messages.length) {

      output += "<ul class='iris-messages'>";

      messages.forEach(function (message) {

        output += "<li class='alert alert-" + message.type + "'>" + message.message + "</li >";

      });

      output += "</ul>";

      iris.clearMessages(thisHook.authPass.userid);

    }

    return output;

  });

  Handlebars.registerHelper('helperMissing', function (args) {

    if (args.data.root.stripCurlies || args.data.root.finalParse) {

      return "";

    } else {

      return "{{" + args.name + "}}";

    }

  });

  Handlebars.registerHelper('iris_handlebars_delay', function (options) {

    return options.fn();

  });

  Handlebars.registerHelper("iris", function () {

    var options = arguments[arguments.length - 1],
      embedOptions,
      title;

    if (Object.keys(options.hash).length) {

      title = options.hash.embed;
      embedOptions = options.hash.config;

    } else {

      var title = arguments[0];

      if (typeof arguments[1] === "string") {

        embedOptions = arguments[1];

      }

    }

    if (embedOptions) {

      try {

        var that = this;

        Object.keys(this).forEach(function (variable) {

          embedOptions = embedOptions.split("$this." + variable).join(that[variable]);

        })

      } catch (e) {


      }

      Object.keys(options.data.root).forEach(function (variable) {

        embedOptions = embedOptions.split("$" + variable).join(options.data.root[variable]);

      })

      embedOptions = embedOptions.split("$this").join(this);

    } else {

      embedOptions = "{}";

    }

    var JSONembedOptions;

    try {

      JSONembedOptions = JSON.parse(embedOptions);

    } catch (e) {

    }

    var vars = {};

    if (options.data && options.data.root) {

      vars = options.data.root;

    }

    // Delay rendering of tags embed as it needs to wait for any additional variables

    if (title === "tags" && options.data) {

      if (!options.data.root.finalParse) {

        return ("{{{iris '" + title + "' '" + embedOptions + "'}}}")

      }

    }

    return new Promise(function (pass, fail) {


      iris.invokeHook("hook_frontend_embed__" + title, thisHook.authPass, {
        embedOptions: JSONembedOptions,
        vars: vars
      }).then(function (output) {

          if (typeof output === "string") {

            pass(output);

          } else if (output.html && options.fn) {

            pass(options.fn(this, {
              blockParams: output.variables
            }));

          } else if (output.html) {

            pass(output.html);

          } else {

            pass();

          }

        },
        function (reason) {

          fail(reason);

        })

    })

  })

  Handlebars.registerHelper("iris_liveupdate", function (options) {

    if (options.data.root.finalParse) {

      return options.fn();

    } else {

      var output = "<div class='iris-live-load'>";
      output += "{{{{iris_handlebars_ignore}}}}";
      output += '<div class="iris-live-load-source" data-iris-live-load-template="' + options.fn().trim().replace(/(\r\n|\n|\r)/gm, "").split("\"").join("&#34;") + '">';
      output += "</div>";
      output += "{{{{/iris_handlebars_ignore}}}}";
      output += "\n";
      output += "<div class='iris-live-load-output'>"
      output += options.fn();
      output += "</div>";
      output += "</div>"

      return output;

    }

  })

  Handlebars.registerHelper('iris_handlebars_ignore', function (options) {

    if (options.data.root.finalParse) {

      return options.fn();

    } else {

      return "{{{{iris_handlebars_ignore}}}}" + options.fn() + "{{{{/iris_handlebars_ignore}}}}";

    }

  });

  thisHook.pass(Handlebars);

});
