/**
 * @file Provides a system for registering text filters for form fields
 */

iris.modules.textfilters.registerHook("hook_form_render_textformat", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  var renderForm = function (config) {

    data.schema.name = {

      "type": "text",
      "title": "Filter name",
      "required": true
    };


    data.schema.elements = {

      "type": "text",
      "title": "Allowed HTML elements",
      "description": "Divided by commas. List without brackets.",
    }

    data.schema.attributes = {

      "type": "text",
      "title": "Allowed HTML attributes",
      "description": "Divided by commas",
    }

    if (config) {

      data.schema.name.type = "hidden";
      data.schema.name.default = config.name;
      data.schema.elements.default = config.elements;
      data.schema.attributes.default = config.attributes;

    }

    thisHook.finish(true, data);

  }

  // Check if editing and form exists in config

  if (thisHook.const.params[1]) {

    if (thisHook.const.params[1].indexOf("{{") !== -1) {

      thisHook.finish(false);

    } else {

      iris.readConfig("textfilters", thisHook.const.params[1]).then(function (config) {

        renderForm(config)

      }, function (fail) {

        thisHook.finish(false);

      })

    }

  } else {

    renderForm();

  }

})

// Add textformat field to text and longtext field types

iris.modules.textfilters.registerHook("hook_form_render_field_settings__longtext", 0, function (thisHook, data) {

  var fs = require("fs");

  var filters = [];

  fs.readdir(iris.configPath + "/textfilters", function (err, savedFilters) {

    if (!err) {

      savedFilters.map(function (filter) {

        filters.push(filter.replace(".json", ""));

      })

    }

    data.schema.settings = {
      type: "object",
      properties: {
        textFilter: {
          "title": "Text filter",
          "type": "text",
          "enum": ["none"].concat(filters)
        }

      }
    }

    thisHook.finish(true, data);

  });

});

iris.modules.textfilters.registerHook("hook_form_submit_textformat", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.const.params, "textfilters", iris.sanitizeName(thisHook.const.params.name), function (response) {

    data = function (res) {

      res.json({
        redirect: "/admin/textfilters"
      })

    }

    thisHook.finish(true, data);

  });

})

iris.route.get("/admin/textfilters", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  var fs = require("fs");

  fs.readdir(iris.configPath + "/textfilters", function (err, data) {

    var filters = [];

    data.map(function (item) {

      filters.push(item.replace(".json", ""))

    })

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

  // If not admin, present 403 page

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

  // If not admin, present 403 page

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

  // If not admin, present 403 page

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

iris.modules.textfilters.registerHook("hook_form_render_texformat_delete", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["textformat"] = {
    type: "hidden",
    default: thisHook.const.params[1]
  };

  thisHook.finish(true, data);

});

iris.modules.textfilters.registerHook("hook_form_submit_texformat_delete", 0, function (thisHook, data) {

  var format = iris.sanitizeName(thisHook.const.params.textformat);

  if (iris.configStore.textformats && iris.configStore.textformats[format]) {

  } else {

    return false;

  }

  iris.deleteConfig("textformats", format, function (err) {

    if (err) {

      thisHook.finish(false, data);

    }

    var data = function (res) {

      res.json({
        redirect: "/admin/textfilters"
      });

    };

    thisHook.finish(true, data);

  });

});

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/textfilters", "Text filters");

iris.modules.textfilters.registerHook("hook_entity_field_view__longtext", 0, function (thisHook, data) {

  if (thisHook.const.field.settings && thisHook.const.field.settings.textFilter) {

    var filter = thisHook.const.field.settings.textFilter;

    iris.readConfig("textfilters", filter).then(function (filterConfig) {

      var sanitizeHtml = require('sanitize-html');
      
      data = sanitizeHtml(data, {
        allowedTags: filterConfig.elements.split(" ").join("").split(","),
        allowedAttributes: {
          "*": filterConfig.attributes.split(" ").join("").split(",")
        }

      });

      thisHook.finish(true, data);

    }, function (fail) {

      thisHook.finish(false, fail);

    })

  } else {

    thisHook.finish(true, data);

  }

})
