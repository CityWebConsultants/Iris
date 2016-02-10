// Password field hook

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__password", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "password",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": null
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__select", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "text",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value,
    "enum": fieldSettings.settings.options
  }

  thisHook.finish(true, data);

});

// Long string field hook

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__longtext", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "textarea",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  }

  thisHook.finish(true, data);

});

// Default field widget hooks

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__Boolean", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "boolean",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__String", 0, function (thisHook, data) {

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

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__[String]", 0, function (thisHook, data) {

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

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__Number", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "number",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__[Number]", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "default": value,
    "description": fieldSettings.description,
    "items": {
      "type": "number"
    }
  }

  thisHook.finish(true, data);

});

// Default entity save widgets

iris.modules.entity.registerHook("hook_entity_fieldType_save_String", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_fieldType_save_Boolean", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_fieldType_save_[String]", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_fieldType_save_[Number]", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_fieldType_save_Number", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})
