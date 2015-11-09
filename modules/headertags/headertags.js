C.registerModule("headertags");

CM.headertags.globals.tags = {};

CM.headertags.globals.newTag = function (category, type, attributes, options) {


  if (!CM.headertags.globals.tags[category]) {

    CM.headertags.globals.tags[category] = [];

  }

  CM.headertags.globals.tags[category].push({

    type: type,
    attributes: attributes,
    options: options

  });

};

CM.headertags.registerHook("hook_frontend_template_context", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.headertags.registerHook("hook_frontend_template_parse", 1, function (thisHook, data) {

  CM.frontend.globals.parseBlock("tags", data.html, function (tagCollectionName, next) {
    
    tagCollectionName = tagCollectionName[0];

    if (CM.headertags.globals.tags[tagCollectionName]) {

      C.hook("hook_headertags_process", thisHook.authPass, CM.headertags.globals.tags[tagCollectionName], CM.headertags.globals.tags[tagCollectionName]).then(function (tagArray) {

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

CM.headertags.registerHook("hook_headertags_process", 0, function (thisHook, tagArray) {

  thisHook.finish(true, tagArray);

});

require("./example.js");
