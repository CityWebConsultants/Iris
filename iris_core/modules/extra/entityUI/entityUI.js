/**
 * @file Forms and form handlers for creating and editing forms, plus string widgets
 */

require('./schemaUI.js');

var fs = require("fs");

iris.app.get("/admin/edit/:type/:eid", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity"], ['admin_wrapper'], {
    eid: req.params.eid,
    type: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})

iris.app.get("/admin/create/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity"], ['admin_wrapper'], {
    type: req.params.type
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})

iris.app.get("/admin/delete/:type/:id", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_entity_delete"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

iris.app.get("/admin/entitylist/:type", function (req, res) {

  iris.modules.entityUI.globals.listEntities(req, res, req.params.type);

});

/**
 * Function used to list entites of a given type. Allows lists to be displayed from
 * different urls.
 */
iris.modules.entityUI.globals.listEntities = function (req, res, type) {
    
  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.entityUI.globals.prepareEntitylist(type, function (output) {

    iris.modules.frontend.globals.parseTemplateFile(["admin_entitylist"], ['admin_wrapper'], {
      entities: output.entities,
      type: type
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

  })
};


// Render entity form

iris.modules.entityUI.registerHook("hook_form_render_entity", 0, function (thisHook, data) {

  // Check if entity type exists in the system

  var entityType = thisHook.const.params[1],
    schema = iris.dbSchemaConfig[entityType];

  if (!schema) {

    thisHook.finish(false, "No such schema");
    return false;

  }

  var renderFields = function (editingEntity) {

    // Get number of fields so we can tell once all the form widgets have been loaded

    var fieldCount = Object.keys(schema).length;

    // First make a clone of the schema 

    schema = JSON.parse(JSON.stringify(schema));

    // Function for checking if all the fields have loaded

    var counter = 0;

    var fieldLoaded = function () {

      counter += 1;

      if (counter === fieldCount) {

        data.schema.entityType = {
          type: "hidden",
          "default": entityType
        }

        if (editingEntity) {

          data.schema.eid = {
            type: "hidden",
            "default": editingEntity.eid
          }

        }

        thisHook.finish(true, data);

      }

    }

    // Function for getting a form for a field

    var getFieldForm = function (field, callback, currentValue) {

      var fieldType = field.fieldType;

      if (fieldType !== "Fieldset") {

        var fieldTypeType = iris.fieldTypes[fieldType].type;

        // Check if a widget has been set for the field

        if (field.widget) {

          iris.hook("hook_entity_field_widget_form__" + iris.sanitizeName(field.widget.name), thisHook.authPass, {
            value: currentValue ? currentValue : null,
            fieldSettings: field,
            widgetSettings: field.widget.settings
          }).then(function (form) {

            callback(form);

          }, function (fail) {

            // Load default field widget as a fallback and finally fall back to field type widget if nothing else available

            iris.hook("hook_entity_field_fieldType_form__" + iris.sanitizeName(fieldType), thisHook.authPass, {
              value: currentValue ? currentValue : null,
              fieldSettings: field
            }).then(function (form) {

              callback(form);

            }, function (fail) {


              iris.hook("hook_entity_field_fieldTypeType_form__" + fieldTypeType, thisHook.authPass, {
                value: currentValue ? currentValue : null,
                fieldSettings: field
              }).then(function (form) {

                callback(form);

              }, function (fail) {

                iris.log("error", "Failed to load entity edit form. " + fail);
                thisHook.finish(false, fail);

              })

            });


          })

        } else {

          // Otherwise run a general hook for that field type

          iris.hook("hook_entity_field_fieldType_form__" + iris.sanitizeName(fieldType), thisHook.authPass, {
            value: currentValue ? currentValue : null,
            fieldSettings: field
          }).then(function (form) {

            callback(form);

          }, function (fail) {

            iris.hook("hook_entity_field_fieldTypeType_form__" + fieldTypeType, thisHook.authPass, {
              value: currentValue ? currentValue : null,
              fieldSettings: field
            }).then(function (form) {

              callback(form);

            }, function (fail) {

              iris.log("error", "Failed to load entity edit form. " + fail);
              thisHook.finish(false, fail);

            })

          })

        }

      } else {

        // It's a fieldset! Load the nested fields

        // TODO Make prepopulated values work

        var defaultValues = [];

        if (currentValue) {

          currentValue.forEach(function (fieldgroup) {

            defaultValues.push(JSON.parse(JSON.stringify(fieldgroup)));

          })

        }

        var fieldset = {
          "type": "array",
          "title": field.label,
          "default": defaultValues,
          "description": field.description,
          "items": {
            "type": "object",
            "properties": {}
          }
        }

        if (!field.subfields || !Object.keys(field.subfields).length) {

          callback();

        } else {

          // Get count of subfields

          var subfieldCount = Object.keys(field.subfields).length;

          var subfieldCounter = 0;
          var subfieldLoaded = function () {

            subfieldCounter += 1;

            if (subfieldCounter === subfieldCount) {

              callback(fieldset);

            }

          }

          Object.keys(field.subfields).forEach(function (subFieldName) {

            getFieldForm(field.subfields[subFieldName], function (form) {

              fieldset.items.properties[subFieldName] = form;

              subfieldLoaded();

            }, currentValue ? currentValue[subFieldName] : null);

          })

        }

      }

    }

    // Loop over all of a schema's fields and put in the form

    Object.keys(schema.fields).forEach(function (fieldName) {

      var field = schema.fields[fieldName];

      getFieldForm(field, function (form) {

        data.schema[fieldName] = form;
        fieldLoaded();

      }, editingEntity ? editingEntity[fieldName] : null);

    })

  }

  // Check if an entity id was provided

  var eid = thisHook.const.params[2];

  if (eid) {
    iris.dbCollections[entityType].findOne({
      eid: eid
    }, function (err, doc) {

      if (doc) {

        renderFields(doc)

      }

    })

  } else {

    renderFields();

  }

});

// Submit new entity form

iris.modules.entityUI.registerHook("hook_form_submit_entity", 0, function (thisHook, data) {

  // Store entity type and then delete from parameters object. Not needed any more there.

  var entityType = thisHook.const.params.entityType;
  var eid = thisHook.const.params.eid;

  delete thisHook.const.params.entityType;
  delete thisHook.const.params.eid;

  // Fetch entity type schema

  var schema = iris.dbSchemaConfig[entityType];

  // Object for final values to be stored in

  var finalValues = {};

  // Get number of fields so we can tell once all the form widgets have been loaded

  var fieldCount = Object.keys(thisHook.const.params).length;

  // Function for checking if all the fields have been loaded, run every time a new field has been processed

  var fieldCounter = 0;

  var fieldProcessed = function () {

    fieldCounter += 1;

    if (fieldCounter === fieldCount) {

      finalValues.entityType = entityType;
      finalValues.entityAuthor = thisHook.authPass.userid;

      var hook;

      if (eid) {

        finalValues.eid = parseInt(eid);
        hook = "hook_entity_edit";

      } else {

        hook = "hook_entity_create"

      }

      iris.hook(hook, thisHook.authPass, finalValues, finalValues).then(function (success) {

        thisHook.finish(true, function (res) {

          res.send({
            redirect: "/admin/structure/entities"
          })

        });

      }, function (fail) {

        thisHook.finish(true, function (res) {

          res.send({
            errors: fail
          });

        });

      });

    }

  }

  // Function for running through a field's save widgets. Takes the field object from the entity's schema and the value posted to the entity save form

  var processField = function (field, value, callback) {

    if (field.fieldType !== "Fieldset")

      callback(value);

    else {

      callback(value);

    }

  }

  Object.keys(thisHook.const.params).forEach(function (field) {

    processField(schema.fields[field], thisHook.const.params[field], function (value) {

      finalValues[field] = value;
      fieldProcessed();

    });

  })

});
