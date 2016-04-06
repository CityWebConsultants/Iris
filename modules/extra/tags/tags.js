/**
 * Defines form_render_field_settings for tags fields.
 * Allows administrators to choose tags that will be made available to the tags field
 */

iris.modules.tags.registerHook("hook_form_render__field_settings__tags", 0, function (thisHook, data) {

  data = {};

  // Set a maximum character length.
  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": {
      "tags": {
        "type": "array",
        "title": "Available tags",
        "items": {
          "type": "text",
        }
      }
    }
  }

  thisHook.pass(data);

});

/**
 * Defines hook_entity_field_fieldType_form for tags fields.
 * Displays the autocomplete tags field and prefills values
 */

iris.modules.tags.registerHook("hook_entity_field_fieldType_form__tags", 0, function (thisHook, data) {

  data = {};

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data.schema = {
    "type": "array",
    "default": value,
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "items": {
      type: "text"
    }
  };

  data.form = {
    "type": "tagsinput",
    "tagsinput": {
      "typeahead": {
        "source": fieldSettings.settings.tags
      }
    }
  }

  thisHook.pass(data);

});

/**
 * Add scripts and CSS needed for displaying tags
 * Some of this could be merged into the main forms module as it will probably be used on other things.
 */

iris.modules.tags.registerHook("hook_frontend_embed__form", 1, function (thisHook, data) {

  var variables = thisHook.context.vars;

  variables.tags.headTags.jqueryuiCSS = {
    type: "link",
    attributes: {
      "href": "/modules/forms/jsonform/deps/opt/jquery.ui.custom.css",
      "rel": "stylesheet"
    },
    rank: 5
  };

  variables.tags.headTags.jqueryuiCSStheme = {
    type: "link",
    attributes: {
      "href": "/modules/forms/jsonform/deps/opt/jquery.ui.theme.css",
      "rel": "stylesheet"
    },
    rank: 5
  };

  variables.tags.headTags.typeahead = {
    type: "script",
    attributes: {
      "src": "/modules/forms/jsonform/deps/opt/bootstrap-typeahead.js"
    },
    rank: 5
  };

  variables.tags.headTags.tagsinput = {
    type: "script",
    attributes: {
      "src": "/modules/forms/jsonform/deps/opt/bootstrap-tagsinput.min.js"
    },
    rank: 5
  };

  variables.tags.headTags.tagsinputCSS = {
    type: "link",
    attributes: {
      "href": "/modules/forms/jsonform/deps/opt/bootstrap-tagsinput.css",
      "rel": "stylesheet"
    },
    rank: 5
  };

  thisHook.pass(data);

});
