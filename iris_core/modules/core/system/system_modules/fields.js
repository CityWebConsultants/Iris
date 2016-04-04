/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

// Password field hook

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__password", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "password",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": null
  };

  thisHook.pass(data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__select", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "text",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value,
    "enum": fieldSettings.settings.options
  };

  thisHook.pass(data);

});

// Long string field hook

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__longtext", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "textarea",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  };

  thisHook.pass(data);

});

// Default field widget hooks

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__Boolean", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "boolean",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  };

  thisHook.pass(data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__String", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "text",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  };

  thisHook.pass(data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__[String]", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "items": {
      "type": "text"
    },
    "default": value
  };

  thisHook.pass(data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__Number", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "number",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  };

  thisHook.pass(data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__[Number]", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "default": value,
    "description": fieldSettings.description,
    "items": {
      "type": "number"
    }
  };

  thisHook.pass(data);

});

var dateToForm = function (value) {

  Number.prototype.padZero = function (len) {
    var s = String(this),
      c = '0';
    len = len || 2;
    while (s.length < len) s = c + s;
    return s;
  };

  if (value) {

    var year = value.getFullYear();

    var month = (value.getMonth() + 1).padZero();

    var day = value.getDate().padZero();

    value = {
      date: year.toString() + "-" + month.toString() + "-" + day.toString(),
      time: value.getUTCHours().padZero() + ":" + value.getUTCMinutes().padZero()
    };

  }

  return value;

};

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__Date", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  if (value) {

    value = dateToForm(value);

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
  };

  thisHook.pass(data);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_form__[Date]", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;


  if (value) {

    var values = [];

    value.forEach(function (date, index) {

      values.push(dateToForm(date));

    });

    value = values;

  }

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "default": value,
    "description": fieldSettings.description,
    "items": {
      "type": "object",
      "properties": {
        "date": {
          "type": "date"
        },
        "time": {
          "type": "time"
        }
      }
    }
  };

  thisHook.pass(data);

});

// Default entity save widgets

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__String", 0, function (thisHook, data) {

  thisHook.pass(thisHook.context.value);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__Boolean", 0, function (thisHook, data) {

  thisHook.pass(thisHook.context.value);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__[String]", 0, function (thisHook, data) {

  thisHook.pass(thisHook.context.value);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__[Number]", 0, function (thisHook, data) {

  thisHook.pass(thisHook.context.value);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__Number", 0, function (thisHook, data) {

  thisHook.pass(thisHook.context.value);

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__Date", 0, function (thisHook, data) {

  if (thisHook.context.value.date) {

    var date = new Date(thisHook.context.value.date);
    date.setUTCHours(thisHook.context.value.time.split(":")[0]);
    date.setUTCMinutes(thisHook.context.value.time.split(":")[1]);

    thisHook.pass(date);

  } else {

    thisHook.pass(undefined);

  }

});

iris.modules.entity.registerHook("hook_entity_field_fieldTypeType_save__[Date]", 0, function (thisHook, data) {

  var dates = [];

  thisHook.context.value.forEach(function (value, index) {

    if (value.date) {

      var date = new Date(value.date);

      date.setUTCHours(value.time.split(":")[0]);
      date.setUTCMinutes(value.time.split(":")[1]);

      dates.push(date);

    }

  });

  thisHook.pass(dates);

});
