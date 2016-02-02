// Password field hook

iris.modules.entity.registerHook("hook_entity_field_widget_render_field_Password", 0, function (thisHook, data) {

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

iris.modules.entity.registerHook("hook_entity_field_widget_render_field_Select", 0, function (thisHook, data) {

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

iris.modules.entity.registerHook("hook_entity_field_widget_render_field_Longtext", 0, function (thisHook, data) {

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

iris.modules.entity.registerHook("hook_entity_field_widget_render_default_Boolean", 0, function (thisHook, data) {

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

iris.modules.entity.registerHook("hook_entity_field_widget_render_default_Number", 0, function (thisHook, data) {

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

iris.modules.entity.registerHook("hook_entity_field_widget_render_default_[Number]", 0, function (thisHook, data) {

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
