/**
 * @file Provides a system for registering text filters for form fields
 */

iris.modules.textfilters.registerHook("hook_form_render_textformat", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  // Check if editing and form exists in config

  if (thisHook.const.params[1] && thisHook.const.params[1].indexOf("{{") !== -1) {

    thisHook.finish(false);

  } else {


    if (iris.configStore.textformats && thisHook.const.params[1] && iris.configStore.textformats[iris.sanitizeName(thisHook.const.params[1])]) {

      var config = iris.configStore.textformats[iris.sanitizeName(thisHook.const.params[1])];

    }

  }

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

  // Hide name if editing and set default values

  if (config) {

    data.schema.name.type = "hidden";
    data.schema.name.default = config.name;
    data.schema.elements.default = config.elements;
    data.schema.attributes.default = config.attributes;


  }

  thisHook.finish(true, data);

})

// Load all textformats on start

var fs = require('fs');
var glob = require("glob");

glob(iris.configPath + "/textformats/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    config = JSON.parse(config);

    if (config.name) {

      iris.saveConfig(config, "textformats", iris.sanitizeName(config.name), function () {

        },
        function (fail) {

          console.log(fail);

        });
    }
  })

})

iris.modules.textfilters.registerHook("hook_form_submit_textformat", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.const.params, "textformats", iris.sanitizeName(thisHook.const.params.name), function (response) {

    data = function (res) {

      res.send("/admin/textfilters")

    }

    thisHook.finish(true, data);

  });

})

iris.app.get("/admin/textfilters", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Textfilters"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_textformats"], ['admin_wrapper'], {
    textformats: iris.configStore.textformats,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.app.get("/admin/textfilters/create", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_textformats_form"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

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

  iris.modules.frontend.globals.parseTemplateFile(["admin_textformats_form"], ['admin_wrapper'], {
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

  iris.modules.frontend.globals.parseTemplateFile(["admin_textformats_delete"], ['admin_wrapper'], {
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

      res.send("/admin/textfilters");

    };

    thisHook.finish(true, data);

  });

});

// Add text formats to text format field

iris.modules.textfilters.registerHook("hook_schemafield_render", 0, function (thisHook, data) {

  var filters = [];

  if (iris.configStore.textformats) {

    Object.keys(iris.configStore.textformats).forEach(function (format) {

      filters.push(iris.configStore.textformats[format].name);

    });

    if (data.properties && data.properties.textFilter) {

      data.properties.textFilter.enum.push(filters);

    };

  }

  thisHook.finish(true, data);

});

var sanitizeHtml = require('sanitize-html');

iris.modules.textfilters.registerHook("hook_entity_presave", 0, function (thisHook, data) {

  var schema = iris.dbCollections[data.entityType].schema.tree;

  Object.keys(data).forEach(function (field) {

    if (schema[field] && schema[field].textFilter) {

      var filter = iris.sanitizeName(schema[field].textFilter);

      if (iris.configStore.textformats && iris.configStore.textformats[filter]) {

        data[field] = sanitizeHtml(data[field], {
          allowedTags: iris.configStore.textformats[filter].elements.split(" ").join("").split(","),
          allowedAttributes: {
            "*": iris.configStore.textformats[filter].attributes.split(" ").join("").split(",")
          }

        });

      }

    }

  });

  thisHook.finish(true, data);

});
