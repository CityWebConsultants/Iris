iris.route.get("/admin/modules", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Modules"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_modules"], ['admin_wrapper'], null, req.authPass, req).then(function (success) {

    // Clear messages

    iris.clearMessages(req.authPass.userid);

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

// Register menu item

var glob = require("glob");
var fs = require("fs");
var path = require("path");

iris.modules.system.registerHook("hook_form_render__modules", 0, function (thisHook, data) {

  // Search for iris files

  glob("{" + iris.rootPath + "/iris_core/modules/extra/**/*.iris.module" + "," + iris.sitePath + "/modules/**/*.iris.module" + "," + iris.rootPath + "/home/modules/**/*.iris.module" + "}", function (er, files) {

    var availableModules = {};

    // Loop over all the files and add to the list of available modules

    files.forEach(function (file) {

      var moduleName = path.basename(file).replace(".iris.module", "");
      var fileDir = path.dirname(file);

      fileDir = fileDir.replace(iris.rootPath, "") + "/" + moduleName;

      try {

        var file = fs.readFileSync(file, "utf8");

        file = JSON.parse(file);

        file.modueName = moduleName;
        file.path = fileDir;

        availableModules[file.modueName] = file;

      } catch (e) {

        iris.log("error", e);

      }

    })

    // Add enabled modules to form

    data.form = [];

    Object.keys(availableModules).forEach(function (moduleName) {

      var currentModule = availableModules[moduleName];

      data.schema[moduleName] = {
        "type": "object",
        "properties": {
          "enabled": {
            "type": "boolean",
            "title": currentModule.name + (currentModule.dependencies ? " - requires " + Object.keys(currentModule.dependencies).join(",") : ""),
            "description": (currentModule.description ? currentModule.description : ""),
            "default": iris.modules[moduleName] ? true : false
          },
          "weight": {
            "type": "hidden",
            "default": currentModule.weight
          },
          "dependencies": {
            "type": "hidden",
            "default": (currentModule.dependencies ? Object.keys(currentModule.dependencies).join(",") : null)
          }
        }
      }

      data.form.push({
        "key": moduleName,
        "inlinetitle": thisHook.authPass.t("Enable the <b>{{name}}</b> module", {name: currentModule.name})
      })

    })

    data.form.push({
      type: "submit",
      title: "submit"
    })

    thisHook.pass(data);

  });

})

iris.modules.system.registerHook("hook_form_submit__modules", 0, function (thisHook, data) {

  // check previous values

  var enabledList = [];
  var disabledList = [];

  Object.keys(thisHook.context.previous.schema).forEach(function (field) {

    if (thisHook.context.previous.schema[field] && thisHook.context.previous.schema[field].properties && thisHook.context.previous.schema[field].properties.enabled) {

      var oldValue = thisHook.context.previous.schema[field].properties.enabled.default;
      var newValue = thisHook.context.params[field].enabled;

      if (oldValue !== newValue) {

        if (newValue) {

          enabledList.push(field);

        } else {

          disabledList.push(field);

        }

      }

    }

  })


  var enabled = [];
  var unmet = [];

  Object.keys(thisHook.context.params).forEach(function (moduleName) {

    if (thisHook.context.params[moduleName].enabled === true) {

      thisHook.context.params[moduleName].name = moduleName;

      // Check dependencies

      if (thisHook.context.params[moduleName].dependencies) {

        var dependencies = thisHook.context.params[moduleName].dependencies.split(",");

        dependencies.forEach(function (dependency) {

          if (!thisHook.context.params[dependency] || thisHook.context.params[dependency].enabled === false) {

            unmet.push(moduleName + " requires " + dependency);

          }

        })

      }

      delete thisHook.context.params[moduleName].enabled;
      delete thisHook.context.params[moduleName].dependencies;

      enabled.push(thisHook.context.params[moduleName]);

    }

  })

  if (unmet.length) {

    thisHook.fail(unmet.join("/n"));
    return false;

  }

  enabled.sort(function (a, b) {
    if (a.weight < b.weight)
      return -1;
    if (a.weight > b.weight)
      return 1;
    return 0;
  });

  enabled.forEach(function (currentModule) {

    delete currentModule.weight;

  })


  fs.writeFileSync(iris.sitePath + "/enabled_modules.json", JSON.stringify(enabled));

  thisHook.pass(data);


  if (enabledList.length) {

    iris.message(thisHook.authPass.userid, thisHook.authPass.t("Enabled: {{list}}", {list: enabledList.join(", ")}), "success");
    
  }

  if (disabledList.length) {

    iris.message(thisHook.authPass.userid, thisHook.authPass.t("Disabled: {{list}}", {list: disabledList.join(", ")}), "success");

  }

  iris.restart(thisHook.authPass.userid, "modules page");

});
