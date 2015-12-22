iris.registerModule("ckeditor");

// Check if a form contains a CKeditor field, if yes, add a special class

iris.modules.ckeditor.registerHook("hook_form_render", 1, function (thisHook, form) {

  thisHook.finish(true, form);

});

iris.modules.ckeditor.registerHook("hook_form_render_textformat", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  // Check if editing and form exists in config

  if (thisHook.const.params[1] && thisHook.const.params[1].indexOf("{{") !== -1) {

    thisHook.finish(false);

  } else {


    if (iris.configStore.textformats && thisHook.const.params[1] && iris.configStore.textformats[iris.sanitizeFileName(thisHook.const.params[1])]) {

      var config = iris.configStore.textformats[iris.sanitizeFileName(thisHook.const.params[1])];

    }

  }

  data.schema.name = {

    "type": "text",
    "title": "Format name",
    "required": true
  };


  data.schema.elements = {

    "type": "text",
    "title": "Allowed elements",
    "required": true,
  }

  data.schema.attributes = {

    "type": "text",
    "title": "Allowed attributes",
    "required": true,
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

      iris.saveConfig(config, "textformats", iris.sanitizeFileName(config.name), function () {

        },
        function (fail) {

          console.log(fail);

        });
    }
  })

})

iris.modules.ckeditor.registerHook("hook_form_submit_textformat", 0, function (thisHook, data) {

  iris.saveConfig(thisHook.const.params, "textformats", iris.sanitizeFileName(thisHook.const.params.name), function (response) {

    thisHook.finish(true, data);

  });

})

iris.app.get("/admin/textformats", function (req, res) {

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

iris.app.get("/admin/textformats/create", function (req, res) {

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

iris.app.get("/admin/textformats/edit/:name", function (req, res) {

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

iris.app.get("/admin/textformats/delete/:name", function (req, res) {

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

iris.modules.ckeditor.registerHook("hook_form_render_texformat_delete", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["textformat"] = {
    type: "hidden",
    default: thisHook.const.params[1]
  };

  thisHook.finish(true, data);

});

iris.modules.ckeditor.registerHook("hook_form_submit_texformat_delete", 0, function (thisHook, data) {

  var format = iris.sanitizeFileName(thisHook.const.params.textformat);

  if (iris.configStore.textformats && iris.configStore.textformats[format]) {

  } else {

    return false;

  }

  iris.deleteConfig("textformats", format, function (err) {

    if (err) {

      thisHook.finish(false, data);

    }

    var data = function (res) {

      res.send("/admin/textformats");

    };

    thisHook.finish(true, data);

  });

});

// Add text formats to text format field

iris.modules.ckeditor.registerHook("hook_schemafield_render", 0, function (thisHook, data) {

  var filters = [];

  Object.keys(iris.configStore.textformats).forEach(function (format) {

    filters.push(iris.configStore.textformats[format].name);

  });

  if (data.properties && data.properties.textFilter) {

    data.properties.textFilter.enum.push(filters);

  };

  thisHook.finish(true, data);

});

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/textformats", "Text formats");

var sanitizeHtml = require('sanitize-html');

iris.modules.ckeditor.registerHook("hook_entity_presave", 0, function (thisHook, data) {

  var schema = iris.dbCollections[data.entityType].schema.tree;

  Object.keys(data).forEach(function (field) {

    if (schema[field] && schema[field].textFilter) {

      var filter = iris.sanitizeFileName(schema[field].textFilter);

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

iris.modules.ckeditor.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var name = thisHook.const.field.fieldTypeName;

  if (name === "longstring") {

    data = {
      "type": "ckeditor",
      "title": thisHook.const.field.label || thisHook.const.field.label,
      "required": thisHook.const.field.required,
      "description": thisHook.const.field.description,
      "default": thisHook.const.value
    }

    thisHook.finish(true, data);

  } else {

    thisHook.finish(true, data);

  }

});

// Register CKeditor widget

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['ckeditor'] = Object.create(JSONForm.elementTypes['text']);

  $(document).ready(function () {

    $.getScript("//cdn.ckeditor.com/4.5.3/standard/ckeditor.js", function () {

      $(".ckeditor").each(function () {
        CKEDITOR.replace(this, {

          customConfig: '/modules/ckeditor/config.js'

        });
      });

      CKEDITOR.on("instanceReady", function () {

        for (var i in CKEDITOR.instances) {

          var parent = $(CKEDITOR.instances[i].element.$);

          parent.attr("required", parent.attr("data-required"));

          CKEDITOR.instances[i].on('change', function (e) {

            var data = e.editor.getData();

            $(e.editor.element)[0].$.innerHTML = data;

          });

        };

      })

    });

  });

  JSONForm.requiredFlip = function (required) {

    if (required) {

      return 'data-required="required"';

    }

  }

  JSONForm.elementTypes['ckeditor'].template = '<textarea class="ckeditor" id="<%= id %>" name="<%= node.name %>" <%= JSONForm.requiredFlip(node.required) %> ><%= value %></textarea>';
  JSONForm.elementTypes['ckeditor'].fieldTemplate = true;
  JSONForm.elementTypes['ckeditor'].inputfield = true;

}, "CKeditor");

// CKeditor file upload field

var fs = require('fs');

iris.app.post('/admin/file/ckeditorupload', function (req, res) {

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(iris.sitePath + "/" + "files");

  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {

    fstream = fs.createWriteStream(iris.sitePath + '/files/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {

      res.end("<script>window.parent.CKEDITOR.tools.callFunction('" + req.query.CKEditorFuncNum + "','/files/" + filename + "','Uploaded!');</script>");

    });
  });

});
