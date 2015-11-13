C.registerModule("views");

var fs = require("fs");

process.on("dbReady", function () {

  // Create a view block type for each entity

  Object.keys(C.dbCollections).forEach(function (entityType) {

    var fields = [];

    Object.keys(C.dbCollections[entityType].schema.tree).forEach(function (fieldName) {

      // Only push in string and number fields

      var field = C.dbCollections[entityType].schema.tree[fieldName];

      if (field.type === String || field.type === Number) {

        fields.push(fieldName);

      }

    });

    CM.blocks.globals.registerBlockType('View-of-' + entityType);

    CM.views.registerHook("hook_form_render_blockForm_View-of-" + entityType, 0, function (thisHook, data) {

      // Add in fields

      var form = {
        "conditions": {
          "type": "array",
          "items": {
            "type": "object",
            "title": "Conditions",
            "properties": {
              "field": {
                "type": "string",
                "title": "Field to check",
                "enum": fields
              },
              "comparison": {
                "type": "string",
                "title": "Operator",
                "enum": ["IS", "IN", "CONTAINS"]
              },
              "compare": {
                "type": "string",
                "title": "Value to check for",
                "description": "This value can be altered dynamically later on"
              },
            }
          }
        },
        "fields": {
          "type": "array",
          "items": {
            "type": "object",
            "title": "Field",
            "properties": {
              "field": {
                "type": "string",
                "title": "Entity field",
                "enum": fields
              },
              "wrapper": {
                "type": "string",
                "title": "HTML wrapper element",
                "enum": ["div", "span", "h1", "h2", "h3"]
              },
              "allowhtml": {
                "type": "boolean",
                "title": "Allow HTML?"
              },
              "class": {
                "type": "string",
                "title": "Classes",
                "description": "Space-separated"
              }
            }
          }
        }
      }

      Object.keys(form).forEach(function (formField) {

        data.schema[formField] = form[formField];

      })

      thisHook.finish(true, data);

    })

  });

})

// Render blocks

CM.views.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.const.type.split("_")[0] === "view") {

    thisHook.finish(true, JSON.stringify(thisHook.const.config));

  } else {

    thisHook.finish(true, data);

  }

});

//CM.views.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {
//
//  var variables = data.variables;
//
//  CM.frontend.globals.parseBlock("view", data.html, function (view, next) {
//
//    var fs = require("fs");
//
//    fs.readFile(C.configPath + "/views/" + view[0] + ".json", "utf8", function (err, file) {
//
//      if (!err) {
//
//        try {
//
//          var viewFile = JSON.parse(file);
//
//          var fetch = {
//            entities: [viewFile.type],
//            queries: viewFile.conditions
//          }
//
//          C.hook("hook_entity_fetch", thisHook.authPass, null, {
//            queryList: [fetch]
//          }).then(function (result) {
//
//            var output = [];
//
//            result.forEach(function (fetched) {
//
//              // Loop over all fields and add variable
//
//              var viewOutput = {};
//
//              viewFile.fields.forEach(function (field, index) {
//
//                viewOutput[field.field] = {};
//
//                // Add all settings provided in the view
//
//                Object.keys(viewFile.fields[index]).forEach(function (fieldSetting) {
//
//                  viewOutput[field.field][fieldSetting] = viewFile.fields[index][fieldSetting];
//
//                })
//
//                if (fetched[field.field]) {
//
//                  viewOutput[field.field].value = fetched[field.field];
//
//                }
//
//              })
//
//              output.push(viewOutput);
//
//            })
//
//            next(result);
//
//          }, function (fail) {
//
//            next(fail);
//
//          });
//
//        } catch (e) {
//
//          next("");
//
//        }
//
//      } else {
//        next("");
//      }
//
//    })
//
//  }).then(function (html) {
//
//    data.html = html;
//
//    thisHook.finish(true, data);
//
//  }, function (fail) {
//
//    C.log("error", fail);
//
//    thisHook.finish(true, data);
//
//  })
//
//});
