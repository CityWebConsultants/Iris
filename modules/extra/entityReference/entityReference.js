/**
 * Ajax callback to compile a list of entities given the type and field to search on.
 */
iris.route.get("/entity-reference/:type/:field", {}, function (req, res) {

  var orgQuery = {
    entities: [req.params.type],
    queries: [{
      field: req.params.field,
      operator: 'contains',
      value: ".*" + req.query.term + ".*"
    }]
  };

  iris.invokeHook("hook_entity_fetch", 'root', null, orgQuery).then(function (entities) {

    var list = [];
    entities.forEach(function (entity) {

      list.push(entity[req.params.field] + '[' + entity.eid + ']');

    });
    res.json(list);

  }, function (fail) {

    res.json([]);

  });

});

/**
 * Defines hook_form_render__field_settings__[fieldname]
 */

var referenceField = function (thisHook, data) {

  var collections = iris.entityTypes;
  var settings = {
    entityType: {
      "type": "text",
      "title": "Select entity type",
      "enum": Object.keys(collections),
    }
  };

  data.form.push("title");
  data.form.push({
    "key": "settings.entityType",
    "onChange": function (e) {
      var choice = $(e.target).val();
      $('.choose-fields').removeClass('open');
      $('.choose-fields.jsonform-error-settings---' + choice).addClass('open');
    }
  });

  var hasValue = false;
  if (data.value.settings && data.value.settings.entityType && data.value.settings.entityType) {

    hasValue = true;

  }

  Object.keys(collections).forEach(function (schema, index) {

    var fields = [];
    Object.keys(collections[schema].fields).forEach(function (field) {

      if (collections[schema].fields[field].fieldType == 'Textfield') {

        fields.push(field);

      }

    });

    settings[schema] = {
      "type": "text",
      "title": "Choose " + schema + " field to search on",
      "enum": fields
    };

    var extraClass = '';

    if (!hasValue && index == 0) {
      extraClass = 'open';
    } else if (data.value.settings && data.value.settings.entityType && data.value.settings.entityType == schema) {
      extraClass = 'open';
    }

    data.form.push({
      "key": "settings." + schema,
      "htmlClass": "choose-fields " + extraClass
    });

  });

  data.schema.title = {
    "type": "markup",
    "markup": "<h3>Field settings</h3>"
  };

  // Set a maximum character length.
  data.schema.settings = {
    "type": "object",
    "title": "Field settings",
    "properties": settings
  }

  data.settingsOverride = true;

  thisHook.pass(data);

};

iris.modules.entityReference.registerHook("hook_form_render__field_settings__entity_reference", 0, function (thisHook, data) {


  referenceField(thisHook, data);


});

iris.modules.entityReference.registerHook("hook_form_render__field_settings__entity_references", 0, function (thisHook, data) {


  referenceField(thisHook, data);


});

/**
 * Defines hook_entity_field_fieldType_form__[entityname] for entity reference fields.
 */
iris.modules.entityReference.registerHook("hook_entity_field_fieldType_form__entity_reference", 0, function (thisHook, data) {

  data = {};

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  if (!value) {

    value = {};

  }

  iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, {
    "entities": [value.entityType],
    queries: [{
      "operator": "is",
      "field": "eid",
      "value": parseInt(value.eid)
    }]
  }).then(function (entity) {

    if (entity && entity.length) {

      var entity = entity[0];

      value = entity[fieldSettings.settings[value.entityType]] + "[" + value.eid + "]";

    } else {

      value = "";

    }

    data.schema = {
      "type": "text",
      "default": value,
      "title": fieldSettings.label,
      "description": fieldSettings.description,
    };

    data.form = {
      "type": "text",
      "autocomplete": {
        "source": '/entity-reference/' + fieldSettings.settings.entityType + '/' + fieldSettings.settings[fieldSettings.settings.entityType]
      }
    }

    thisHook.pass(data);

  }, function (fail) {

    console.log(fail);

  })

});


/**
 * Defines hook_entity_field_fieldType_form__[entityname] for entity reference fields.
 */
iris.modules.entityReference.registerHook("hook_entity_field_fieldType_form__entity_references", 0, function (thisHook, data) {

  data = {};

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;
  var newValue = [];

  if (!value) {

    value = [];

  }

  var fetched = 0;

  var done = function () {

    fetched++;

    if (fetched >= value.length) {

      data.schema = {
        "type": "array",
        "default": newValue,
        "title": fieldSettings.label,
        "description": fieldSettings.description,
        "items": {
          "type": "text",
          renderSettings: {
            "autocomplete": {
              "source": '/entity-reference/' + fieldSettings.settings.entityType + '/' + fieldSettings.settings[fieldSettings.settings.entityType]
            }
          }
        }
      }

      thisHook.pass(data);

    }

  }

  if (!value.length) {

    done();

  }


  value.forEach(function (current) {

    iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, {
      "entities": [current.entityType],
      queries: [{
        "operator": "is",
        "field": "eid",
        "value": parseInt(current.eid)
    }]
    }).then(function (entity) {

      if (entity && entity.length) {

        var entity = entity[0];

        newValue.push(entity[fieldSettings.settings[current.entityType]] + "[" + current.eid + "]");

      } else {

        newValue.push(null);

      }

      done();

    });

  })

});

iris.modules.entityReference.registerHook("hook_entity_field_fieldType_save__entity_reference", 0, function (thisHook, data) {

  var settings = thisHook.context.field.settings;

  var entityType = settings.entityType;

  if (!thisHook.context.value) {


    data = {
      entityType: null,
      eid: null
    }


  } else {

    var eid = thisHook.context.value.match(/[^[\]]+(?=])/g)[0];

    data = {
      entityType: entityType,
      eid: parseInt(eid)
    }

  }

  thisHook.pass(data);

});

iris.modules.entityReference.registerHook("hook_entity_field_fieldType_save__entity_references", 0, function (thisHook, data) {

  var settings = thisHook.context.field.settings;

  var entityType = settings.entityType;

  if (!thisHook.context.value) {

    data = [{
      entityType: null,
      eid: null
    }]


  } else {

    data = [];

    thisHook.context.value.forEach(function (reference) {

      try {
        var eid = reference.match(/[^[\]]+(?=])/g)[0];

        data.push({
          entityType: entityType,
          eid: parseInt(eid)
        })

      } catch (e) {


      }

    })

  }

  thisHook.pass(data);

});

/**
 * Add scripts and CSS needed for displaying tags
 * Some of this could be merged into the main forms module as it will probably be used on other things.
 */

iris.modules.entityReference.registerHook("hook_frontend_embed__form", 1, function (thisHook, data) {

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

  variables.tags.headTags.entityReferenceStyles = {
    type: "link",
    attributes: {
      "href": "/modules/entityReference/style.css",
      "rel": "stylesheet"
    },
    rank: 5
  };

  thisHook.pass(data);

});
