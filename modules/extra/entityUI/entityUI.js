/**
 * @file Forms and form handlers for creating and editing forms, plus string widgets
 */

require('./schemaUI.js');

var fs = require("fs");

var routes = {
  delete: {
    title: 'Delete entity',
  },
  create: {
    title: 'Create new entity',
  }
};

iris.app.get("/:type/:eid/edit", function (req, res) {

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

iris.route.get("/:type/create", routes.create, function (req, res) {

  req.irisRoute.options.title = req.authPass.t('Create new {{type}}', {
    type: req.params.type
  });

  if (iris.modules.auth.globals.checkPermissions(["can create " + req.params.type], req.authPass)) {

    iris.modules.frontend.globals.parseTemplateFile(["admin_entity"], ['admin_wrapper'], {
      type: req.params.type
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

  } else {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

});

iris.route.get("/:type/:id/delete", routes.delete, function (req, res) {

  req.irisRoute.options.title = req.authPass.t('Delete entity {{id}}?', {
    id: req.params.id
  });

  iris.dbCollections[req.params.type].findOne({
    "eid": req.params.id
  }, function (err, entity) {

    if (err != null || entity === null) {

      iris.modules.frontend.globals.displayErrorPage(404, req, res);

      return false;

    }

    var isOwn = req.authPass.userid == entity.entityAuthor;
    var deleteOwn = iris.modules.auth.globals.checkPermissions(["can delete own " + entity.entityType], req.authPass);
    var deleteAny = iris.modules.auth.globals.checkPermissions(["can delete any " + entity.entityType], req.authPass);
    if (!deleteAny && !(isOwn && deleteOwn) && req.authPass.userid != 1) {

      iris.modules.frontend.globals.displayErrorPage(403, req, res);

      return false;

    }

    iris.modules.frontend.globals.parseTemplateFile(["admin_entity_delete"], ['admin_wrapper'], {
      text: req.authPass.t('Are you sure you want to delete this entity?'),
      type: req.params.type,
      id: req.params.id
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

  });

});

// Render entity form

iris.modules.entityUI.registerHook("hook_form_render__entity", 0, function (thisHook, data) {

  // Check if entity type exists in the system

  var entityType = thisHook.context.params[1],
    schema = iris.dbSchemaConfig[entityType];

  if (!schema) {

    thisHook.fail("No such schema");
    return false;

  }

  var renderFields = function (editingEntity) {

    // Get number of fields so we can tell once all the form widgets have been loaded

    var fieldCount = Object.keys(schema.fields).length;

    // First make a clone of the schema 

    schema = JSON.parse(JSON.stringify(schema));

    // Function for checking if all the fields have loaded

    var counter = 0;

    var fieldLoaded = function () {

      // Sort by rank

      var fields = [];

      var isAdmin = (thisHook.authPass.roles.indexOf("admin") !== -1);

      Object.keys(schema.fields).forEach(function (field) {

        var canEdit = false;

        thisHook.authPass.roles.forEach(function (role) {

          var schemafield = schema.fields[field].edit_permissions;

          if (isAdmin || (schemafield && (schemafield.indexOf(role) !== -1))) {

            canEdit = true;

          }

        });

        if (canEdit) {

          fields.push({

            name: field,

            weight: schema.fields[field].weight

          });
        }

      });

      fields.sort(function (a, b) {

        if (a.weight > b.weight) {

          return 1;

        } else if (a.weight < b.weight) {

          return -1;

        } else {

          return 0;

        }

      })

      // Reorder form elements

      var formRaw = data.form;

      data.form = [];

      fields.forEach(function (field) {

        formRaw.forEach(function (formField) {

          if (formField === field.name || formField.key === field.name) {

            data.form.push(formField);

          }

        });

      });


      counter += 1;

      if (counter === fieldCount) {

        data.form.push("entityType");

        data.schema.entityType = {
          type: "hidden",
          "default": entityType
        }

        if (editingEntity) {

          data.form.push("eid");

          data.schema.eid = {
            type: "hidden",
            "default": editingEntity.eid
          }

        }

        data.form.push({
          type: "submit",
          value: thisHook.authPass.t("Save {{type}}", {
            type: entityType
          })
        });

        thisHook.pass(data);

      }

    }

    // Function for getting a form for a field

    var getFieldForm = function (field, callback, currentValue, fieldName) {

      var fieldType = field.fieldType;
      var fieldTypeType;

      try {

        fieldTypeType = iris.fieldTypes[fieldType].type;

      } catch (e) {

        fieldTypeType = field.type

      }

      if (fieldType !== "Fieldset") {

        // Check if a widget has been set for the field

        if (field.widget) {

          iris.invokeHook("hook_entity_field_widget_form__" + iris.sanitizeName(field.widget.name), thisHook.authPass, {
            value: currentValue ? currentValue : null,
            fieldSettings: field,
            widgetSettings: field.widget.settings
          }).then(function (form) {

            callback(form);

          }, function (fail) {

            // Load default field widget as a fallback and finally fall back to field type widget if nothing else available

            iris.invokeHook("hook_entity_field_fieldType_form__" + iris.sanitizeName(fieldType), thisHook.authPass, {
              value: currentValue ? currentValue : null,
              fieldSettings: field
            }).then(function (form) {

              if (form) {
                callback(form);
              } else {

                iris.invokeHook("hook_entity_field_fieldTypeType_form__" + fieldTypeType, thisHook.authPass, {
                  value: currentValue ? currentValue : null,
                  fieldSettings: field
                }).then(function (form) {

                  callback(form);

                }, function (fail) {

                  iris.log("error", "Failed to load entity edit form. " + fail);
                  thisHook.fail(fail);

                })

              }

            }, function (fail) {

              iris.log("error", "Failed to load entity edit form. " + fail);
              thisHook.fail(fail);


            });


          })

        } else {

          // Otherwise run a general hook for that field type

          iris.invokeHook("hook_entity_field_fieldType_form__" + iris.sanitizeName(fieldType), thisHook.authPass, {
            value: currentValue ? currentValue : null,
            fieldSettings: field
          }).then(function (form) {

            if (form) {
              callback(form);
            } else {

              iris.invokeHook("hook_entity_field_fieldTypeType_form__" + fieldTypeType, thisHook.authPass, {
                value: currentValue ? currentValue : null,
                fieldSettings: field
              }).then(function (form) {

                if (form) {

                  callback(form);

                } else {

                  // Might be a custom complex field type

                  if (typeof fieldTypeType === "object") {

                    var form = {
                      type: "object",
                      title: fieldName,
                      properties: {}
                    }

                    Object.keys(iris.fieldTypes[fieldType].type).forEach(function (nested) {

                      form.properties[nested] = {
                        title: nested,
                        default: currentValue ? currentValue[nested] : null
                      }

                      switch (iris.fieldTypes[fieldType].type[nested]) {
                        case "String":
                          form.properties[nested].type = "text"
                          break;
                        case "Number":
                          form.properties[nested].type = "number"
                          break;
                      }

                    })

                    callback(form);

                  }

                }

              }, function (fail) {

                iris.log("error", "Failed to load entity edit form. " + fail);
                thisHook.fail(fail);

              })

            }

          }, function (fail) {

            iris.log("error", "Failed to load entity edit form. " + fail);
            thisHook.fail(fail);

          })

        }

      } else {

        // It's a fieldset! Load the nested fields

        var fieldset = {
          "type": "array",
          "title": field.label,
          "expandable": true,
          "default": [],
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

          var length = 1;

          if (currentValue && currentValue.length) {

            length = currentValue.length;

          }

          for (var i = 1; i <= length; i += 1) {

            fieldset.default.push({});

          }

          Object.keys(field.subfields).forEach(function (subFieldName) {

            var valueCounter = 0;

            var valueLoaded = function () {

              valueCounter += 1;

              if (valueCounter === length) {

                subfieldLoaded();

              }

            }

            var key = [];
            var finished = false;
            var getFieldPath = function (fields, parent, field, current) {

              if (finished) {
                return;
              }
              var subfields = Object.keys(fields);
              for (var i = 0; i < subfields.length; i++) {

                if (finished) {
                  return;
                }

                key.push(subfields[i] + '[]');
                if (subfields[i] == field && current == parent) {
                  finished = true;
                  return;
                }

                if (fields[subfields[i]].subfields) {
                  current = subfields[i];
                  getFieldPath(fields[subfields[i]].subfields, parent, field, current);
                } else {
                  key.pop();
                }

              };
              if (!finished) {
                key.pop();
              }

            }

            Object.keys(fieldset.default).forEach(function (element, index) {

              getFieldForm(field.subfields[subFieldName], function (form) {

                if (field.subfields[subFieldName].required) {

                  form.required = true;

                }

                if (form.schema && form.schema.default) {
                  fieldset.default[index][subFieldName] = form.schema.default;
                } else if (form.default) {
                  fieldset.default[index][subFieldName] = form.default;
                }

                delete form.default;

                //if (form.form) {

                if (!fieldset.form) {
                  fieldset.form = {
                    "key": fieldName,
                    "type": "array",
                    "items": [{
                      "type": "fieldset",
                      "items": []
                    }]
                  };
                }

                getFieldPath(schema.fields, fieldName, subFieldName);
                var keyPath = key.join('.');
                keyPath = keyPath.substring(0, keyPath.length - 2);;
                if (form.form) {
                  form.form.key = keyPath;
                }
                var fieldExists = false;
                for (var i = 0; i < fieldset.form.items[0].items.length; i++) {

                  if (typeof fieldset.form.items[0].items[i] == 'object') {

                    if (fieldset.form.items[0].items[i].key == keyPath) {

                      fieldExists = true;

                    }
                  } else if (fieldset.form.items[0].items[i] == keyPath) {

                    fieldExists = true;

                  }
                }

                if (!fieldExists) {

                  if (form.form) {

                    if (form.schema) {
                      Object.keys(form.schema).forEach(function (item) {

                        if (!form.form[item]) {

                          form.form[item] = form.schema[item];

                        }

                      });
                    }

                    fieldset.form.items[0].items.push(form.form);

                  } else {

                    fieldset.form.items[0].items.push(keyPath);

                  }

                }

                if (form.form) {
                  delete form.form;
                }

                if (form.schema) {
                  delete form.schema;
                }

                //}

                fieldset.items.properties[subFieldName] = form;

                valueLoaded();

              }, currentValue && currentValue[index] ? currentValue[index][subFieldName] : null, subFieldName);

            })

          })


        }

      }

    }

    // Loop over all of a schema's fields and put in the form

    Object.keys(schema.fields).forEach(function (fieldName) {

      var field = schema.fields[fieldName];

      getFieldForm(field, function (form) {

        if (!data.form) {

          data.form = [];

        }

        if (form.form) {

          form.form.key = fieldName;

          data.form.push(form.form);

        } else {

          data.form.push(fieldName);

        }


        if (form.schema) {

          form = form.schema;

        }

        if (field.required) {

          form.required = true;

        }

        data.schema[fieldName] = form;
        fieldLoaded();

      }, editingEntity ? editingEntity[fieldName] : null, fieldName);

    })



  }

  // Check if an entity id was provided

  var eid = thisHook.context.params[2];

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

iris.modules.entityUI.registerHook("hook_form_submit__entity", 0, function (thisHook, data) {

  // Store entity type and then delete from parameters object. Not needed any more there.

  var entityType = thisHook.context.params.entityType;
  var eid = thisHook.context.params.eid;

  delete thisHook.context.params.entityType;
  delete thisHook.context.params.eid;

  // Fetch entity type schema

  var schema = iris.dbSchemaConfig[entityType];

  // Object for final values to be stored in

  var finalValues = {};

  // Get number of fields so we can tell once all the form widgets have been loaded

  var fieldCount = Object.keys(thisHook.context.params).length;

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

        Object.keys(schema.fields).forEach(function (field) {

          if (!finalValues[field]) {

            finalValues[field] = null;

          }

        })

      } else {

        hook = "hook_entity_create"

      }

      iris.invokeHook(hook, thisHook.authPass, finalValues, finalValues).then(function (success) {

        data.callback = "/admin/structure/entities";
        thisHook.pass(data);

      }, function (fail) {

        var msg = thisHook.authPass.t("Error saving entity");

        if (fail.errmsg) {

          msg = fail.errmsg;

        } else {

          msg = JSON.stringify(fail);

        }
        data.errors.push({
          'message': msg
        });

        iris.log("error", msg);
        thisHook.pass(data);

      });

    }

  }

  // Function for running through a field's save widgets. Takes the field object from the entity's schema and the value posted to the entity save form

  var processField = function (field, value, callback) {


    if (field.fieldType !== "Fieldset") {

      var fieldTypeType = iris.fieldTypes[field.fieldType].type;

      iris.invokeHook("hook_entity_field_fieldType_save__" + iris.sanitizeName(field.fieldType), thisHook.authPass, {
        value: value,
        field: field
      }, value).then(function (newValue) {

        iris.invokeHook("hook_entity_field_fieldTypeType_save__" + fieldTypeType, thisHook.authPass, {
          value: newValue,
          field: field
        }, newValue).then(function (finalValue) {

          callback(finalValue);

        });

      }, function (fail) {

        thisHook.fail(fail);

      })

    } else {

      if (field.subfields && Object.keys(field.subfields).length) {

        var fieldsetValue = [];

        var subfieldCount = Object.keys(field.subfields).length;

        // Need to loop over all the values as well

        var valueCount = value.length;

        // Push in empty objects to store the fields in

        for (var i = 0; i < valueCount; i++) {

          fieldsetValue.push({});

        }

        var valueCounter = 0;
        var valueDone = function () {

          valueCounter += 1;

          if (valueCounter === valueCount * subfieldCount) {

            // Check if empty

            fieldsetValue.forEach(function (element, index) {

              Object.keys(element).forEach(function (key) {

                if (!element[key]) {

                  delete fieldsetValue[index][key];

                }

              })

              if (Object.keys(element).length === 0) {

                fieldsetValue.splice(index, 1);

              }


            })


            callback(fieldsetValue);

          }

        }

        Object.keys(field.subfields).forEach(function (subfieldName) {

          value.forEach(function (valueObject, index) {

            processField(field.subfields[subfieldName], valueObject[subfieldName], function (subfieldValue) {

              fieldsetValue[index][subfieldName] = subfieldValue;
              valueDone();

            })

          })

        })

      } else {

        callback(value);

      }

    }

  }

  Object.keys(thisHook.context.params).forEach(function (field) {

    processField(schema.fields[field], thisHook.context.params[field], function (value) {

      finalValues[field] = value;
      fieldProcessed();

    });

  })

});

// List of entity types with view content links

iris.route.get("/admin/entitylist", {
  title: "Content",
  description: "View content",
  permissions: ["can access admin pages"],
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Content"
    }]
}, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_entitytypelist"], ['admin_wrapper'], {
    entityTypes: Object.keys(iris.dbCollections)
  }, req.authPass, req).then(function (success) {

    res.send(success)

  });

});


// List of entities

iris.route.get("/admin/entitylist/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.invokeHook("hook_entity_fetch", req.authPass, null, {
    entities: [req.params.type]
  }).then(function (result) {

    iris.modules.frontend.globals.parseTemplateFile(["admin_entitylist"], ['admin_wrapper'], {
      type: req.params.type,
      entities: result
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

  }, function (fail) {


    res.send(fail);

  });

})
