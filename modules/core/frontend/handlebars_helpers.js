// Store live embeds temporarily. Timeout is for how long the embed is stored if it hasn't been paired to a websocket connection.

iris.modules.frontend.globals.liveEmbeds = {};
iris.modules.frontend.globals.liveEmbedTimeout = 4000;


iris.modules.frontend.registerSocketListener("liveEmbedRegister", function (socket, data) {

  var embed = iris.modules.frontend.globals.liveEmbeds[data];

  if (embed) {

    embed.socket = socket.id;

    if (!socket.irisEmbeds) {

      socket.irisEmbeds = [];

    }

    socket.irisEmbeds.push(embed);

    setInterval(function () {

      embed.sendResult();

    }, 3000)

  }

})

// Delete embed if no longer in use by socket

iris.modules.frontend.registerHook("hook_socket_disconnected", 0, function (thisHook, data) {

  Object.keys(iris.modules.frontend.globals.liveEmbeds).forEach(function (embedID) {

    var embed = iris.modules.frontend.globals.liveEmbeds[embedID];

    if (embed.socket === thisHook.context.socket.id) {

      delete iris.modules.frontend.globals.liveEmbeds[embedID];

    }

  })

  thisHook.pass(data);

})

iris.modules.frontend.globals.parseIrisEmbed = function (settings, authPass, liveToken) {

  return new Promise(function (pass, fail) {

    iris.invokeHook("hook_frontend_embed__" + settings.title, authPass, {
      embedOptions: settings.embedOptions,
      vars: settings.vars,
      blockEmbed: settings.blockEmbed
    }).then(function (output) {

        if (!output) {

          pass();
          return false;

        }

        if (typeof output === "string") {

          pass(output);

        } else if (output.html && settings.template) {

          var blockTemplate = settings.template(this, {
            blockParams: output.variables
          }).then(function (result) {

            var processed = output.blockHeader + result + output.blockFooter;

            if (liveToken) {

              processed = '<div data-liveupdate="' + liveToken + '">' + processed + '</div>';

            }

            pass(processed);

          });

        } else if (output.html) {

          pass(output.html);

        } else {

          pass();

        }

      },
      function (reason) {

        fail(reason);

      })

  });

}

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

  Handlebars.registerHelper("iris", function () {

    var options = arguments[arguments.length - 1],
      embedOptions,
      title,
      block,
      liveUpdate;

    if (Object.keys(options.hash).length) {

      title = options.hash.embed;
      embedOptions = options.hash.config;
      liveUpdate = options.hash.liveupdate;

    } else {

      var title = arguments[0];

      if (typeof arguments[1] === "string") {

        embedOptions = arguments[1];

      }

    }

    // Mark if this is being used as a block as some embeds will want to do things differently for that

    if (options.fn) {

      block = true;

    } else {

      block = false;

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

      // Create unique ID for embed if liveupdating

      var settings = {
        title: title,
        embedOptions: JSONembedOptions,
        vars: vars,
        blockEmbed: block,
        template: options.fn
      }

      if (liveUpdate) {

        var crypto = require('crypto');

        crypto.randomBytes(16, function (ex, buf) {

          // Liveupdate token for tracking embeds

          var token = title + "_" + buf.toString('hex');

          settings.getResult = function (authPass = thisHook.authPass) {

            return new Promise(function (pass, fail) {

              iris.modules.frontend.globals.parseIrisEmbed(settings, authPass).then(function (result) {

                pass(result);

              });

            }, function (fail) {

              fail(fail);

            });

          }

          settings.sendResult = function (authPass) {

            settings.getResult(authPass).then(function (result) {

              var socket = iris.socketServer.clients().connected[settings.socket];

              if (socket) {

                socket.emit("liveUpdate", {
                  id: token,
                  content: result
                });

              }

            })

          }

          iris.modules.frontend.globals.liveEmbeds[token] = settings;

          setTimeout(function () {

            if (iris.modules.frontend.globals.liveEmbeds[token] && !iris.modules.frontend.globals.liveEmbeds[token].socket) {

              // Check output

              iris.modules.frontend.globals.parseIrisEmbed(iris.modules.frontend.globals.liveEmbeds[token], thisHook.authPass).then(function (embedOutput) {

              })

              delete iris.modules.frontend.globals.liveEmbeds[token];

            }

          }, iris.modules.frontend.globals.liveEmbedTimeout);

          iris.modules.frontend.globals.parseIrisEmbed(settings, thisHook.authPass, token).then(function (result) {

            pass(result);

          });

        });

      } else {

        iris.modules.frontend.globals.parseIrisEmbed(settings, thisHook.authPass).then(function (result) {

          pass(result);

        });

      }

    });

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
