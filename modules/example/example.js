C.registerModule("example");

CM.example.registerHook("hook_entity_view_example", 0, function (thisHook, entities) {

  var sanitizeHtml = require('sanitize-html');

  entities.forEach(function (entity) {

    entity.body = sanitizeHtml(entity.body, {
      allowedTags: ['h1', 'h2', 'h3', 'b', 'i', 'em', 'strong', 'li', 'ul', 'hr', 'table', 'tr', 'td', 'th', 'strike'],
    });

  });

  thisHook.finish(true, entities);

});
