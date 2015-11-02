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
