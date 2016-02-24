/**
 * @member hook_frontend_embed__tags
 * @memberof frontend
 *
 * @desc Parses embeded client side tags such as JavaScript, CSS and meta tags
 *
 */
iris.modules.frontend.registerHook("hook_frontend_embed__tags", 0, function (thisHook, data) {

  var tagName = thisHook.const.embedParams[0];

  var tagExclude = thisHook.const.embedParams[1];

  var vars = thisHook.const.vars;

  if (!vars.finalParse) {

    thisHook.finish(false, data);
    return false;

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

        };

        if (tag.type === "script") {

          output += "></" + tag.type + ">"

        } else {

          output += "/>";

        }
      }
    });

  }

  thisHook.finish(true, output);

})
