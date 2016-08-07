var fs = require("fs");

process.on("dbReady", function () {

  // Unset all hooks as this will overwrite them with new dynamic ones

  Object.keys(iris.modules.lists.hooks).forEach(function (hook) {

    delete iris.modules.lists.hooks[hook];

  });

  // Create a view block type for each entity

  Object.keys(iris.entityTypes).forEach(function (entityType) {

    var fields = ["Pick a field"];

    Object.keys(iris.entityTypes[entityType].fields).forEach(function (fieldName) {

      // Only push in string and number fields

      var field = iris.entityTypes[entityType].fields[fieldName];

      fields.push(fieldName);

    });

    iris.modules.blocks.globals.registerBlockType('List-of-' + entityType);

    iris.modules.lists.registerHook("hook_form_render__blockForm_List-of-" + entityType, 0, function (thisHook, data) {

      thisHook.context.context.tags.headTags.ace = {
        type: "script",
        attributes: {
          "src": "/modules/forms/jsonform/deps/opt/ace/ace.js"
        },
        rank: 7
      };

      thisHook.context.context.tags.headTags.aceHTML = {
        type: "script",
        attributes: {
          "src": "/modules/forms/jsonform/deps/opt/ace/mode-html.js"
        },
        rank: 7
      };

      if (thisHook.context.params && iris.modules.blocks.globals.blocks["List-of-" + entityType] && iris.modules.blocks.globals.blocks["List-of-" + entityType][thisHook.context.params]) {

        var existingView = iris.modules.blocks.globals.blocks["List-of-" + entityType][thisHook.context.params];

        existingView.output = "{{{{iris_handlebars_ignore}}}}" + existingView.output + "{{{{/iris_handlebars_ignore}}}}";

        data.value = existingView;

      }

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
              "operator": {
                "type": "string",
                "title": "Operator",
                "enum": ["IS", "IN", "CONTAINS"]
              },
              "value": {
                "type": "string",
                "title": "Value to check for"
              },
            }
          }
        },
        "output": {
          "type": "ace",
          "title": thisHook.authPass.t("Template output"),
          "description": thisHook.authPass.t("The HTML output for this list. Entities are stored in the 'list' handlebars variable."),
          renderSettings: {
            aceMode: "html",
          }
        },
        "limit": {
          "type": "number",
          "title": "Limit",
          "default": 0
        },
        "sort": {
          "title": "sort",
          "type": "object",
          "properties": {
            "field": {
              type: "text",
              enum: fields
            },
            "order": {
              "type": "text",
              "enum": ["asc", "desc"]
            }
          }
        }
      };

      Object.assign(data.schema, form);

      thisHook.pass(data);

    });

  });

});

// Render blocks

iris.modules.lists.registerHook("hook_block_render", 0, function (thisHook, data) {

  if (thisHook.context.type.split("-")[0] === "List") {

    var config = thisHook.context.config;

    if (config.conditions) {

      config.conditions.forEach(function (condition, index) {

        if (condition.field === "Pick a field") {

          config.conditions.splice(index, 1);

        }

      });

    }


    var entityType = thisHook.context.type.replace("List-of-", "");

    var query = {
      entities: [entityType]
    };

    if (config.conditions) {

      query.queries = config.conditions;

    }

    if (config.limit) {

      query.limit = config.limit;

    }

    if (config.sort) {

      query.sort = {};

      query.sort[config.sort.field] = config.sort.order;

    }

    var template = config.output.split("list").join("list_" + config.blockTitle);

    var sendQuery = "[[[entity list_" + config.blockTitle + "," + JSON.stringify(query) + "]]]" + template;

    thisHook.pass(sendQuery);

  } else {

    thisHook.fail(data);

  }


});
