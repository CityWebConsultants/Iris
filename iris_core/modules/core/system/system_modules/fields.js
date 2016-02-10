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

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__Date", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  Number.prototype.padZero = function (len) {
    var s = String(this),
      c = '0';
    len = len || 2;
    while (s.length < len) s = c + s;
    return s;
  }

  if (value) {

    var year = value.getFullYear();

    var month = (value.getMonth() + 1).padZero();

    var day = value.getDate().padZero();

    value = {
      date: year.toString() + "-" + month.toString() + "-" + day.toString(),
      time: value.getUTCHours().padZero() + ":" + value.getUTCMinutes().padZero()
    }

  }

  data = {
    "type": "object",
    "title": fieldSettings.label,
    "default": value,
    "description": fieldSettings.description,
    "properties": {
      "date": {
        type: "date"
      },
      time: {
        "type": "time"
      }
    }
  }

  thisHook.finish(true, data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__[Date]", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "default": value,
    "description": fieldSettings.description,
    "items": {
      "type": "date"
    }
  }

  thisHook.finish(true, data);

});

// Default entity save widgets

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__String", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__Boolean", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__[String]", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__[Number]", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__Number", 0, function (thisHook, data) {

  thisHook.finish(true, thisHook.const.value);

})

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__Date", 0, function (thisHook, data) {

  var date = new Date(thisHook.const.value.date);

  date.setUTCHours(thisHook.const.value.time.split(":")[0]);
  date.setUTCMinutes(thisHook.const.value.time.split(":")[1]);

  thisHook.finish(true, date);

})
