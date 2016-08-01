/**
 * @member hook_frontend_embed__tags
 * @memberof frontend
 *
 * @desc Parses embeded client side tags such as JavaScript, CSS and meta tags
 *
 */
iris.modules.frontend.registerHook("hook_frontend_embed__tags", 0, function (thisHook, data) {

  var tagName = thisHook.context.embedID;

  // TODO - Allow JSON object for more tag options
  
  var tagExclude = thisHook.context.embedOptions;

  var vars = thisHook.context.vars;

  if (!vars.finalParse) {

    thisHook.fail(data);
    return false;

  }


  var tags = [];
  if(vars.tags[tagName] !== undefined){

    Object.keys(vars.tags[tagName]).forEach(function(item, index){
      tags.push({item: item, rank: vars.tags[tagName][item].rank, data: JSON.stringify(vars.tags[tagName][item])});
    });

    tags.sort(function(a, b){
      return  a.rank - b.rank;
    });

    vars.tags[tagName] = {};
    tags.forEach(function(item, index){
      vars.tags[tagName][item.item] = JSON.parse(item.data);
    });

  }

  var output = "";

  if (vars.tags && vars.tags[tagName]) {

    var tagContainer = vars.tags[tagName];

    output = "<!-- " + tagName + " -->";

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

  }

  thisHook.pass(output);

});
