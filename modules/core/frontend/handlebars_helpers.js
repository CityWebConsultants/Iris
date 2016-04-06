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

  Handlebars.registerHelper('if_eq', function(a, b, opts) {
    if(a == b) // Or === depending on your needs
      return opts.fn(this);
    else
      return opts.inverse(this);
  });

  // Parse JSON

  Handlebars.registerHelper('json', function(context) {
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

  Handlebars.registerHelper('iris_handlebars_ignore', function (options) {

    if (options.data.root.finalParse) {

      return options.fn();

    } else {

      return "{{{{iris_handlebars_ignore}}}}" + options.fn() + "{{{{/iris_handlebars_ignore}}}}";

    }

  });

  thisHook.pass(Handlebars);

});
