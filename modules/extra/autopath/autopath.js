/**
 * Register permission for editing autopath settings.
 */

iris.modules.auth.globals.registerPermission("can adminster autopath", "paths");

/**
 * Define callback routes.
 */
var routes = {
  adminStructure: {
    title: "Autopath",
    description: "Auto-generate tokenised url paths for entities.",
    permissions: ["can administer autopath"],
    menu: [{
      menuName: "admin_toolbar",
      parent: "/admin/structure",
      title: "Autopath"
    }]
  }
}

/**
 * Create route for autopath administration page.
 */
iris.route.get("/admin/structure/autopath", routes.adminStructure, function (req, res) {

  // Push in all entity types that have a path field

  var entityTypes = [];

  Object.keys(iris.dbSchemaConfig).forEach(function (entityType) {

    if (iris.dbSchemaConfig[entityType].fields && iris.dbSchemaConfig[entityType].fields.path) {

      entityTypes.push(entityType);

    }

  })

  iris.modules.frontend.globals.parseTemplateFile(["admin_autopath"], ['admin_wrapper'], {
    entityTypes: entityTypes
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})

/**
 * Register autopath settings form (admin page shows one for each entity type). 
 * Implements hook_form_render
 */

iris.modules.autopath.registerHook("hook_form_render__autopath", 0, function (thisHook, data) {

  var entityType = thisHook.context.params[1];

  var tokens = [];

  Object.keys(iris.dbSchemaConfig[entityType].fields).forEach(function (fieldName) {

    var type = iris.dbSchema[entityType][fieldName].type;

    if (type === String) {

      tokens.push("[" + fieldName + "]");

    }

  })

  var render = function (savedPattern) {

    data.schema.entityType = {

      "type": "hidden",
      "default": entityType

    }

    data.schema.pattern = {

      "type": "text",
      "title": thisHook.authPass.t("Path pattern"),
      "description": thisHook.authPass.t("Fill in a path, you may include any of the following tokens to substitute field values from the entity itself. <br /> Available tokens: <b>{{tokens}}</b>", {
        tokens: tokens.join(" ")
      }),

    }

    if (savedPattern) {

      data.schema.pattern.default = savedPattern;

    }

    thisHook.pass(data);

  }

  iris.readConfig("autopath", entityType).then(function (savedPattern) {

    render(savedPattern)

  }, function (fail) {

    render();

  });

})

/**
 * Register autopath settings form submit handler to save config. 
 * Implements hook_form_submit
 */

iris.modules.autopath.registerHook("hook_form_submit__autopath", 0, function (thisHook, data) {

  if (thisHook.context.params.pattern[0] !== "/") {

    thisHook.context.params.pattern = "/" + thisHook.context.params.pattern;

  }

  iris.saveConfig(thisHook.context.params.pattern, "autopath", thisHook.context.params.entityType, function () {

    thisHook.pass(data);

  })


});

/**
 * Add helper description to entity edit forms with a path. 
 * Implements hook_form_render
 */

iris.modules.autopath.registerHook("hook_form_render__entity", 2, function (thisHook, data) {

  if (data.schema && data.schema.path) {

    if (!data.schema.path.description) {

      data.schema.path.description = "";

    }

    data.schema.path.description = thisHook.authPass.t("{{desc}} Leave empty or clear to set path automatically based on autopath settings.", {
      desc: data.schema.path.description
    })

    thisHook.pass(data);

  } else {

    thisHook.pass(data);

  }

});

/**
 * Save path using autopath template if available and path is left empty (swap out [token] values) 
 * Implements hook_entity_presave
 */

iris.modules.autopath.registerHook("hook_entity_presave", 2, function (thisHook, data) {

  if ((!data.path || !data.path.length) && iris.dbSchemaConfig[data.entityType].fields.path) {

    iris.readConfig("autopath", data.entityType).then(function (savedPattern) {

        Object.keys(data).forEach(function (field) {

          if (savedPattern.indexOf("[" + field + "]") !== -1) {

            var value = iris.sanitizeName(data[field]).split("_").join("-");

            savedPattern = savedPattern.split("[" + field + "]").join(value);

          }

        })

        data.path = savedPattern;

        thisHook.pass(data);

      },
      function (fail) {

        thisHook.pass(data);

      });

  } else {

    thisHook.pass(data);

  }

});
