iris.registerModule("headertags");

iris.modules.headertags.globals.tags = {};

iris.modules.headertags.globals.newTag = function (type, attributes, rank) {

  iris.modules.headertags.globals.tags[category].push({
    type: type,
    attributes: attributes,
    rank: rank
  });

};

iris.modules.headertags.registerHook("hook_frontend_template_parse", 1, function (thisHook, data) {

  iris.modules.frontend.globals.parseEmbed("tags", data.html, function (tagCollectionName, next) {

    tagCollectionName = tagCollectionName[0];

    if (iris.modules.headertags.globals.tags[tagCollectionName]) {

      iris.hook("hook_headertags_process", thisHook.authPass, iris.modules.headertags.globals.tags[tagCollectionName], iris.modules.headertags.globals.tags[tagCollectionName]).then(function (tagArray) {

        var output = "";

        // Process the tags

        tagArray.forEach(function (tag) {

          // Starting tag

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

        });

        next(output);

      });

    } else {

      next("<!-- Could not find tag collection " + tagCollectionName + " -->");

    };

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  });

});

iris.modules.headertags.registerHook("hook_headertags_process", 0, function (thisHook, tagArray) {

  thisHook.finish(true, tagArray);

});

require("./example.js");
