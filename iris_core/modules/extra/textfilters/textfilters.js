/**
 * @file Provides a system for registering text filters for form fields
 */

/**
 * Defines textformat form.
 * Allows edit and creation of text filters
 */

iris.modules.textfilters.registerHook("hook_form_render__textfilter", 0, function (thisHook, data) {

  var ap = thisHook.authPass;
  if (!data.schema) {

    data.schema = {};

  }

  var renderForm = function (config) {

    data.schema.name = {

      "type": "text",
      "title": ap.t("Filter name"),
      "required": true
    };


    data.schema.elements = {

      "type": "text",
      "title": ap.t("Allowed HTML elements"),
      "description": ap.t("Divided by commas. List without brackets."),
    }

    data.schema.attributes = {

      "type": "text",
      "title": ap.t("Allowed HTML attributes"),
      "description": ap.t("Divided by commas"),
    }

    if (config) {

      data.schema.name.type = "hidden";
      data.schema.name.default = config.name;
      data.schema.elements.default = config.elements;
      data.schema.attributes.default = config.attributes;

    }

    thisHook.pass(data);

  }

  if (thisHook.context.params[1]) {

    if (thisHook.context.params[1].indexOf("{{") !== -1) {

      thisHook.fail();

    } else {

      iris.readConfig("textfilters", thisHook.context.params[1]).then(function (config) {

        renderForm(config)

      }, function (fail) {

        thisHook.fail();

      })

    }

  } else {

    renderForm();

  }

})

/**
 * Defines textfilters settings on longtext field forms.
 */

iris.modules.textfilters.registerHook("hook_form_render__field_settings__longtext", 0, function (thisHook, data) {

  var fs = require("fs");

  var filters = [];

  fs.readdir(iris.configPath + "/textfilters", function (err, savedFilters) {

    if (!err && savedFilters) {

      savedFilters.map(function (filter) {

        filters.push(filter.replace(".json", ""));

      })

    }

    data.schema.settings = {
      type: "object",
      properties: {
        textFilter: {
          "title": thisHook.authPass.t("Text filter"),
          "type": "text",
          "enum": ["none"].concat(filters)
        }

      }
    }

    thisHook.pass(data);

  });

});

/**
 * Submit handler for textfilter form.
 */

iris.modules.textfilters.registerHook("hook_form_submit__textfilter", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.context.params, "textfilters", iris.sanitizeName(thisHook.context.params.name), function (response) {

    data = function (res) {

      res.json({
        redirect: "/admin/textfilters"
      })

    }

    thisHook.pass(data);

  });

})

iris.route.get("/admin/textfilters", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Textfilters"
  }]
}, function (req, res) {


  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  var fs = require("fs");

  fs.readdir(iris.configPath + "/textfilters", function (err, data) {

    var filters = [];

    if (data) {

      data.map(function (item) {

        filters.push(item.replace(".json", ""))

      })

    }

    iris.modules.frontend.globals.parseTemplateFile(["admin_textfilters"], ['admin_wrapper'], {
      textfilters: filters,
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });

  })

})

iris.app.get("/admin/textfilters/create", function (req, res) {

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_textfilters_form"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/textfilters/edit/:name", function (req, res) {

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_textfilters_form"], ['admin_wrapper'], {
    formatname: req.params.name
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/textfilters/delete/:name", function (req, res) {

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_textfilters_delete"], ['admin_wrapper'], {
    formatname: req.params.name
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

/**
 * Defines textfilter delete form.
 */

iris.modules.textfilters.registerHook("hook_form_render__textfilter_delete", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["textformat"] = {
    type: "hidden",
    default: thisHook.context.params[1]
  };

  thisHook.pass(data);

});

/**
 * Textfilter delete form submit handler.
 */

iris.modules.textfilters.registerHook("hook_form_submit__textfilter_delete", 0, function (thisHook, data) {

  var format = iris.sanitizeName(thisHook.context.params.textformat);

  iris.deleteConfig("textfilters", format, function (err) {

    var data = function (res) {

      res.json({
        redirect: "/admin/textfilters"
      });

    };

    thisHook.pass(data);

  });

});

iris.modules.textfilters.registerHook("hook_entity_view_field__longtext", 0, function (thisHook, data) {

  if (thisHook.context.field.settings && thisHook.context.field.settings.textFilter) {

    var filter = thisHook.context.field.settings.textFilter;

    iris.readConfig("textfilters", filter).then(function (filterConfig) {

      var sanitizeHtml = require('sanitize-html');

      data = sanitizeHtml(data, {
        allowedTags: filterConfig.elements.split(" ").join("").split(","),
        allowedAttributes: {
          "*": filterConfig.attributes.split(" ").join("").split(",")
        }

      });

      thisHook.pass(data);

    }, function (fail) {

      thisHook.fail(fail);

    })

  } else {

    thisHook.pass(data);

  }

})
