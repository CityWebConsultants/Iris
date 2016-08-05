// Store live embeds temporarily. Timeout is for how long the embed is stored if it hasn't been paired to a websocket connection.

iris.modules.frontend.globals.liveEmbeds = {};
iris.modules.frontend.globals.liveEmbedTimeout = 4000;

iris.modules.frontend.registerSocketListener("liveEmbedRegister", function (socket, data) {

  var embedType = data.split("_")[0];
  var embedID = data;

  var embed = iris.modules.frontend.globals.liveEmbeds[embedType][embedID];

  if (embed) {

    embed.socket = socket.id;

    if (!socket.irisEmbeds) {

      socket.irisEmbeds = [];

    }

    socket.irisEmbeds.push(embed);

  }

});

// Delete embed if no longer in use by socket

iris.modules.frontend.registerHook("hook_socket_disconnected", 0, function (thisHook, data) {

  Object.keys(iris.modules.frontend.globals.liveEmbeds).forEach(function (category) {

    Object.keys(iris.modules.frontend.globals.liveEmbeds[category]).forEach(function (embedID) {

      var embed = iris.modules.frontend.globals.liveEmbeds[category][embedID];

      if (embed.socket === thisHook.context.socket.id) {

        delete iris.modules.frontend.globals.liveEmbeds[category][embedID];

      }

    });

  });

  thisHook.pass(data);

});

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

        } else if (settings.template) {

          var blockTemplate = settings.template(this, {
            blockParams: output.variables
          }).then(function (result) {

            if (!output.blockHeader) {

              output.blockHeader = "";

            }

            if (!output.blockFooter) {

              output.blockFooter = "";

            }

            var processed = output.blockHeader + result + output.blockFooter;

            if (liveToken) {

              processed = '<div class="iris-liveupdate" data-liveupdate="' + liveToken + '">' + processed + '</div>';

            }

            pass(processed);

          });

        } else if (output.content) {

          pass(output.content);

        } else {

          pass("");

        }

      },
      function (reason) {

        fail(reason);

      });

  });

};

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

    var clientAuthPass = this.authPass;

    var options = arguments[arguments.length - 1],
      title,
      extraSettings = {},
      block,
      liveUpdate;

    if (Object.keys(options.hash).length) {

      title = options.hash.embed;
      liveUpdate = options.hash.liveupdate;
      extraSettings = options.hash;

    } else {

      title = arguments[0];

      if (arguments[1] && typeof arguments[1] === "string") {

        extraSettings.config = arguments[1];

      } else {

        extraSettings.config = "{}";

      }

    }

    if (!clientAuthPass && options.data.root) {

      clientAuthPass = options.data.root.authPass;

    }

    // Mark if this is being used as a block as some embeds will want to do things differently for that

    if (options.fn) {

      block = true;

    } else {

      block = false;

    }

    var that = this;
    var stringSettings = "";

    Object.keys(extraSettings).forEach(function (settingKey) {

      if (typeof extraSettings[settingKey] !== "string") {

        // Already JSON

        return false;

      }

      try {

        stringSettings += ` ${settingKey}='${extraSettings[settingKey]}' `;

        Object.keys(this).forEach(function (variable) {

          extraSettings[settingKey] = extraSettings[settingKey].split("$this." + variable).join(that[variable]);

        });

        Object.keys(options.data.root).forEach(function (variable) {

          if (typeof options.data.root[variable] === "object") {

            try {

              Object.keys(options.data.root[variable]).forEach(function (subkey) {

                extraSettings[settingKey] = extraSettings[settingKey].split("$" + variable + "." + subkey).join(options.data.root[variable][subkey]);

              });

            } catch (e) {



            }


          } else {

            extraSettings[settingKey] = extraSettings[settingKey].split("$" + variable).join(options.data.root[variable]);

          }

        });

        extraSettings[settingKey] = extraSettings[settingKey].split("$this").join(this);

        try {

          extraSettings[settingKey] = JSON.parse(extraSettings[settingKey]);


        } catch (e) {

          // Not valid JSON. Send as is. Could force JSON but not sure if needed.

        }

      } catch (e) {

        delete extraSettings[settingKey];

      }

    });

    var vars = {};

    if (options.data && options.data.root) {

      vars = options.data.root;

    }

    // Delay rendering of tags embed as it needs to wait for any additional variables

    if (title === "tags" && options.data) {

      if (!options.data.root.finalParse) {

        var rawTagEmbed = "{{{iris embed='" + title + "' " + stringSettings + "}}}";

        return rawTagEmbed;

      }

    }

    return new Promise(function (pass, fail) {

      // Create unique ID for embed if liveupdating

      var embedOptions = {};

      Object.keys(extraSettings).forEach(function (key) {

        embedOptions[key] = extraSettings[key];

      });

      if (extraSettings.config) {

        Object.keys(extraSettings.config).forEach(function (key) {

          embedOptions[key] = extraSettings.config[key];

        });

      }

      if (extraSettings.embedOptions) {

        Object.keys(extraSettings.embedOptions).forEach(function (key) {

          embedOptions[key] = extraSettings.embedOptions[key];

        });

      }

      var settings = {
        title: title,
        embedOptions: embedOptions,
        vars: vars,
        blockEmbed: block,
        template: options.fn
      };

      if (liveUpdate) {

        var crypto = require('crypto');

        crypto.randomBytes(16, function (ex, buf) {

          // Liveupdate token for tracking embeds

          var token = title + "_" + buf.toString('hex');

          settings.getResult = function (authPass) {

            if (!authPass) {

              authPass = clientAuthPass;

            }

            return new Promise(function (pass, fail) {

              iris.modules.frontend.globals.parseIrisEmbed(settings, authPass).then(function (result) {

                pass(result);

              }, function (reason) {

                fail(reason);

              });

            }, function (failReason) {

              fail(failReason);

            });

          };

          settings.sendResult = function (authPass) {

            settings.getResult(authPass).then(function (result) {

              var socket = iris.socketServer.clients().connected[settings.socket];

              if (socket) {

                socket.emit("liveUpdate", {
                  id: token,
                  content: result
                });

              }

            });

          };

          if (!iris.modules.frontend.globals.liveEmbeds[title]) {

            iris.modules.frontend.globals.liveEmbeds[title] = {};

          }

          iris.modules.frontend.globals.liveEmbeds[title][token] = settings;

          setTimeout(function () {

            if (iris.modules.frontend.globals.liveEmbeds[title][token] && !iris.modules.frontend.globals.liveEmbeds[title][token].socket) {

              delete iris.modules.frontend.globals.liveEmbeds[token];

            }

          }, iris.modules.frontend.globals.liveEmbedTimeout);

          iris.modules.frontend.globals.parseIrisEmbed(settings, clientAuthPass, token).then(function (result = "") {

            pass(result);

          }, function (fail) {

            iris.log("error", fail);

            pass("");

          });

        });

      } else {

        iris.modules.frontend.globals.parseIrisEmbed(settings, clientAuthPass).then(function (result = "") {

          pass(result);

        }, function (fail) {

          iris.log("error", fail);

          pass("");

        });

      }

    });

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
