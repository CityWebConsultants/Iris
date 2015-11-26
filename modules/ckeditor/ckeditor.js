C.registerModule("ckeditor");

// Check if a form contains a CKeditor field, if yes, add a special class

CM.ckeditor.registerHook("hook_form_render", 1, function (thisHook, form) {

  thisHook.finish(true, form);

});

var sanitizeHtml = require('sanitize-html');

CM.ckeditor.registerHook("hook_entity_presave", 0, function (thisHook, data) {

  var schema = C.dbCollections[data.entityType].schema.tree;

  Object.keys(data).forEach(function (field) {

    if (schema[field] && schema[field].allowedTags) {

      var tags = schema[field].allowedTags.split(",");

      data[field] = sanitizeHtml(data[field], {
        allowedTags: tags,
      });

    }

  });

  thisHook.finish(true, data);

});

CM.ckeditor.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var type = thisHook.const.fieldTypeType;
  var name = thisHook.const.fieldTypeName;

  if (name === "long") {

    data = {
      "type": "textarea",
      "title": thisHook.const.title,
      "required": thisHook.const.required,
      "description": thisHook.const.description,
    }

    thisHook.finish(true, data);

  } else {

    thisHook.finish(true, data);

  }

});
