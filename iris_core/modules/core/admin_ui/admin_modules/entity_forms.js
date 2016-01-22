/**
 * @file Forms and form handlers for creating and editing forms, plus string widgets
 */

iris.registerModule("entityforms");

var fs = require("fs");

iris.modules.entity.registerHook("hook_form_render_entity", 0, function (thisHook, data) {

  // Check if entity type exists

  var entityType = thisHook.const.params[1],
    schema = iris.dbSchema[entityType];

  var renderForm = function (currentEntity) {

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

    if (fieldCount === 0) {

      data.schema.entityType = {
        type: "hidden",
        default: entityType
      }

      thisHook.finish(true, data);

    }

    // Function for checking if all the widgets have been loaded successfully

    var counter = 1;

    var widgetLoaded = function () {

      if (counter === fieldCount) {

        data.schema.entityType = {
          type: "hidden",
          default: entityType
        }

        // Put fields in the right order based on weight

        var fieldList = [];

        Object.keys(schema).forEach(function (fieldName) {

          schema[fieldName].machineName = fieldName;
          
          fieldList.push(schema[fieldName]);

        });

        fieldList.sort(function (a, b) {

          if (a.weight > b.weight) {

            return 1;

          } else if (a.weight < b.weight) {

            return -1;

          } else {

            return 0;

          }

        })

        var fieldNamesList = [];

        fieldList.forEach(function (fieldInList, index) {

          fieldNamesList.push(fieldInList.machineName)

        })

        // Generate form

        data.form = [];

        fieldNamesList.forEach(function (currentFieldName) {

          data.form.push(currentFieldName);

        })

        data.form.push("entityType");

        data.form.push({
          type: "submit",
          value: "Save " + entityType
        })

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
          value: currentEntity ? currentEntity[fieldName] : null,
          fieldSettings: field,
          widgetSettings: field.widget.settings
        }).then(function (form) {

          data.schema[fieldName] = form;
          widgetLoaded();

        }, function (fail) {

          // Load default widget as a fallback

          iris.hook("hook_entity_field_widget_render_default_" + fieldTypeType, thisHook.authPass, {
            value: currentEntity ? currentEntity[fieldName] : null,
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
          value: currentEntity ? currentEntity[fieldName] : null,
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


  }

  // Check if an entity id was provided

  var eid = thisHook.const.params[2];

  if (eid) {

    // Fetch entity from database

    iris.dbCollections[entityType].findOne({
      eid: eid
    }, function (err, doc) {

      if (doc) {

        renderForm(doc);

      } else {

        thisHook.finish(false, "No such entity");

      }

    })

  } else {

    renderForm();

  }

})

// Default field widget hooks

iris.modules.entity.registerHook("hook_entity_field_widget_render_default_String", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "text",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_entity_field_widget_render_default_[String]", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "items": {
      "type": "text",
      "default": value
    }
  }

  thisHook.finish(true, data);

});

// Submit new entity form

iris.modules.entity.registerHook("hook_form_submit_entity", 0, function (thisHook, data) {

  // Store entity type and then delete from parameters object. Not needed any more there.

  var entityType = thisHook.const.params.entityType;

  delete thisHook.const.params.entityType;

  // Fetch entity schmea

  var schema = iris.dbSchema[entityType];

  // Object for final values to be stored in

  var finalValues = {};

  // Get number of fields so we can tell once all the form widgets have been loaded

  var fieldCount = Object.keys(thisHook.const.params).length;

  // Function for checking if all the widgets have been loaded successfully

  var counter = 1;

  var widgetSaved = function () {

    if (counter === fieldCount) {

      finalValues.entityType = entityType;
      finalValues.entityAuthor = thisHook.authPass.userid;

      iris.hook("hook_entity_create", thisHook.authPass, finalValues, finalValues).then(function (success) {

        thisHook.finish(true, function (res) {

          res.send({
            redirect: "/admin/entities"
          })

        });

      }, function (fail) {

        console.log(fail);
        thisHook.finish(false, fail);

      });

    }

    counter += 1;

  }

  // Run widget loading function for every field

  Object.keys(thisHook.const.params).forEach(function (fieldName) {

    var field = schema[fieldName];
    var value = thisHook.const.params[fieldName];
    var fieldType = field.fieldType;
    var fieldTypeType = iris.fieldTypes[fieldType].type;

    // Function for saving a field after the widget phase

    var saveField = function (setValue) {

      iris.hook("hook_entity_field_save_" + fieldType, thisHook.authPass, {
        value: setValue,
        fieldSettings: field
      }).then(function (updatedValue) {

          iris.hook("hook_entity_fieldType_save_" + fieldTypeType, thisHook.authPass, {
            value: updatedValue
          }).then(function (finalValue) {

            finalValues[fieldName] = finalValue;
            widgetSaved();

          }, function (fail) {

            thisHook.finish(false, fail);

          })

          // Finally pass to default save hook for the field type

        },
        function (fail) {

          if (fail === "No such hook exists") {

            iris.hook("hook_entity_fieldType_save_" + fieldTypeType, thisHook.authPass, {
              value: setValue
            }).then(function (finalValue) {

              finalValues[fieldName] = finalValue;

              widgetSaved();

            }, function (fail) {

              thisHook.finish(false, fail);

            })

          } else {

            thisHook.finish(false, fail);
          }

        })

    };

    // Check if a widget has been set for the field

    if (field.widget) {

      iris.hook("hook_entity_field_widget_save_" + field.widget.name, thisHook.authPass, {
        value: value,
        fieldSettings: field,
        widgetSettings: field.widget.settings
      }).then(function (savedValue) {

        value = savedValue;
        saveField(value);

      }, function (fail) {

        if (fail === "No such hook exists") {

          saveField(value);

        } else {

          thisHook.finish(false, fail);

        }

      })

    } else {

      saveField(value);

    }

  })

});

// Default entity save widgets

iris.modules.entity.registerHook("hook_entity_fieldType_save_String", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_fieldType_save_[String]", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})
