/**
 * @file Forms and form handlers for creating and editing forms, plus string widgets
 */

iris.registerModule("entityforms");

var fs = require("fs");

iris.modules.entityforms.registerHook("hook_form_render_createEntity", 0, function (thisHook, data) {

  // Check if entity type exists

  var entityType = thisHook.const.params[1],
    schema = iris.dbSchema[entityType];

  if (!schema) {

    thisHook.finish(false, data);
    return false;

  }

  // Loop over all the fields and generate their forms based on the widgets available

  // First make a clone of the schema 

  schema = JSON.parse(JSON.stringify(schema));

  // Remove universal fields. TODO: We're doing this in lots of places so should probably make it a util function. Also extendable that way if new fields come in.

  delete schema.eid;
  delete schema.entityAuthor;
  delete schema.entityType;

  // Get number of fields so we can tell once all the form widgets have been loaded

  var fieldCount = Object.keys(schema).length;

  // Function for checking if all the widgets have been loaded successfully

  var counter = 1;

  var widgetLoaded = function () {

    if (counter === fieldCount) {

      thisHook.finish(true, data);

    }

    counter += 1;

  }

  // Run widget loading function for every field

  Object.keys(schema).forEach(function (fieldName) {

    var field = schema[fieldName];
    var fieldType = field.fieldType;
    var fieldTypeType = iris.fieldTypes[fieldType].type;

    // Check if a widget has been set for the field

    if (field.widget) {

      iris.hook("hook_entity_field_widget_render_" + field.widget.name, thisHook.authPass, {
        value: null,
        fieldSettings: field,
        widgetSettings: field.widget.settings
      }).then(function (form) {

        data.schema[fieldName] = form;
        widgetLoaded();

      }, function (fail) {

        // Load default widget as a fallback

        iris.hook("hook_entity_field_widget_render_default_" + fieldTypeType, thisHook.authPass, {
          value: null,
          fieldSettings: field
        }).then(function (form) {

          data.schema[fieldName] = form;
          widgetLoaded();

        }, function (fail) {

          iris.log("error", "Failed to load entity edit form. " + fail);
          thisHook.finish(false, fail);

        })

      })

    } else {

      // Otherwise run a general hook for that field type

      iris.hook("hook_entity_field_widget_render_default_" + fieldTypeType, thisHook.authPass, {
        value: null,
        fieldSettings: field
      }).then(function (form) {

        data.schema[fieldName] = form;
        widgetLoaded();

      }, function (fail) {

        iris.log("error", "Failed to load entity edit form. " + fail);
        thisHook.finish(false, fail);

      })


    }


  })

})

// Default field widget hooks

iris.modules.entity.registerHook("hook_entity_field_widget_render_default_String", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "text",
    title: fieldSettings.label,
    "description": fieldSettings.description
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_entity_field_widget_render_default_ofString", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "items": {
      type: "text"
    }
  }

  thisHook.finish(true, data);

});
