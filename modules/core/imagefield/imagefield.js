iris.registerModule("imagefield");

iris.modules.imagefield.registerHook("hook_entity_field_fieldType_form__image", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "object",
    "properties": {
      "path": {
        "type": "file",
        "title": thisHook.authPass.t("Image upload")
      },
      "title": {
        "type": "text",
        "title": thisHook.authPass.t("Image title")
      },
      "alt": {
        "type": "text",
        "title": thisHook.authPass.t("Image alternative text")
      }
    }
  }

  if (value && value.path) {

    data.properties.path.default = value.path;

  }

  if (value && value.alt) {

    data.properties.alt.default = value.alt;

  }

  if (value && value.title) {

    data.properties.title.default = value.title;

  }

  thisHook.pass(data);

});

// Move image from temp on save

iris.modules.filefield.registerHook("hook_entity_field_fieldType_save__image", 0, function (thisHook, data) {
  
  var fs = require("fs");
  
  var value = thisHook.context.value;

  var path = value.path.split(" ").join("_");
  
  // Check if temp folder contains this file

  fs.readFile(iris.sitePath + '/temp/' + path, function (err, data) {

    if (!err) {

      fs.rename(iris.sitePath + '/temp/' + path, iris.sitePath + '/files/' + path, function () {
        
        value.path = '/files/' + path;
        
        thisHook.pass(value);

      });

    } else {

      thisHook.pass(value);

    }

  });

});
