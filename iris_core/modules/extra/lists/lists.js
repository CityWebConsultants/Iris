iris.registerModule("lists");

var fs = require("fs");

process.on("dbReady", function () {

  // Create a view block type for each entity

  Object.keys(iris.dbCollections).forEach(function (entityType) {

    var fields = ["Pick a field"];

    Object.keys(iris.dbCollections[entityType].schema.tree).forEach(function (fieldName) {

      // Only push in string and number fields

      var field = iris.dbCollections[entityType].schema.tree[fieldName];

      if (field.type === String || field.type === Number) {

        fields.push(fieldName);

      }

    });

    iris.modules.blocks.globals.registerBlockType('List-of-' + entityType);

    iris.modules.lists.registerHook("hook_form_render_blockForm_List-of-" + entityType, 0, function (thisHook, data) {

      if (thisHook.const.params[1] && iris.modules.blocks.globals.blocks["List-of-" + entityType] && iris.modules.blocks.globals.blocks["List-of-" + entityType][thisHook.const.params[1]]) {

        var existingView = iris.modules.blocks.globals.blocks["List-of-" + entityType][thisHook.const.params[1]];

        data.value = existingView;

      }

      // Add in fields

      var form = {
        "limit": {
          "type": "number",
          "title": "Limit",
          "default": 0
        },
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
              "operator": {
                "type": "string",
                "title": "Operator",
                "enum": ["IS", "IN", "CONTAINS"]
              },
              "value": {
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

iris.modules.lists.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.const.type.split("-")[0] === "List") {

    var config = thisHook.const.config;

    if (config.conditions) {

      config.conditions.forEach(function (condition, index) {

        if (condition.field === "Pick a field") {

          config.conditions.splice(index, 1);

        }

      })

    }

    var fetch = {
      entities: [thisHook.const.type.replace("List-of-", "")],
      queries: config.conditions,
      limit: config.limit
    }

    iris.hook("hook_entity_fetch", thisHook.authPass, null, {
      queryList: [fetch]
    }).then(function (result) {

        var output = [];

        if (!result || !result.length) {

          thisHook.finish(true, "<!-- No results for " + thisHook.const.type + " " + thisHook.const.id + "-->");
          return false;

        }

        result.forEach(function (fetched) {

          // Loop over all fields and add variable

          var viewOutput = {};

          config.fields.forEach(function (field, index) {

            viewOutput[field.field] = {};

            // Add all settings provided in the view

            Object.keys(config.fields[index]).forEach(function (fieldSetting) {

              viewOutput[field.field][fieldSetting] = config.fields[index][fieldSetting];

            })

            if (fetched[field.field]) {

              viewOutput[field.field].value = fetched[field.field];

            }

          })

          output.push(viewOutput);

        });

        iris.modules.frontend.globals.parseTemplateFile(["lists", thisHook.const.type], null, {
          list: output,
          listName: thisHook.const.id
        }, thisHook.authPass).then(function (success) {

          // Add in entity embed template


          // Generate entity fetch template

          var embed = "[[[entity ";

          embed += fetch.entities.join("+");

          embed += ",";

          embed += "list_" + thisHook.const.id;

          embed += ",";

          // Add in queries

          fetch.queries.forEach(function (query) {

            embed += query.field + "|" + query.operator + "|" + JSON.stringify(query.value) + "+";

          })

          // Remove final +

          embed = embed.substring(0, embed.length - 1);

          embed += ",";

          embed += "]]]"

          thisHook.finish(true, embed + "\n" + success);

        }, function (fail) {

          thisHook.finish(true, fail);

        })

      },
      function (fail) {

        thisHook.finish(true, fail);

      });

  } else {

    thisHook.finish(true, data);

  }

});
