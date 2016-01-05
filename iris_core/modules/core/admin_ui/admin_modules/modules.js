iris.app.get("/admin/modules", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_modules"], ['admin_wrapper'], null, req.authPass, req).then(function (success) {

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

iris.modules.admin_ui.registerHook("hook_form_render_modules", 0, function (thisHook, data) {

  // Search for iris files

  glob("{" + iris.rootPath + "/modules/extra/**/*.iris" + "," + iris.sitePath + "/modules/**/*.iris" + "," + iris.rootPath + "/home/modules/**/*.iris" + "}", function (er, files) {

    var availableModules = {};

    // Loop over all the files and add to the list of available modules

    files.forEach(function (file) {

      var moduleName = path.normalize(path.basename(file).replace(".iris", ""));
      var fileDir = path.normalize(path.dirname(file));
      
      fileDir = path.normalize(fileDir.replace(iris.rootPath.replace("iris_core", ""), "") + "/" + moduleName);

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
          "rank": {
            "type": "hidden",
            "default": currentModule.rank
          },
          "path": {
            "type": "hidden",
            "default": currentModule.path
          },
          "dependencies": {
            "type": "hidden",
            "default": (currentModule.dependencies ? Object.keys(currentModule.dependencies).join(",") : null)
          }
        }
      }

      data.form.push({
        "key": moduleName,
        "inlinetitle": "Enable the <b>" + currentModule.name + "</b> module",
      })

    })

    data.form.push({
      type: "submit",
      title: "submit"
    })

    thisHook.finish(true, data);

  });

})

iris.modules.admin_ui.registerHook("hook_form_submit_modules", 0, function (thisHook, data) {

  var enabled = [];
  var unmet = [];

  Object.keys(thisHook.const.params).forEach(function (moduleName) {

    if (thisHook.const.params[moduleName].enabled === "true") {

      thisHook.const.params[moduleName].name = moduleName;

      // Check dependencies

      if (thisHook.const.params[moduleName].dependencies) {

        var dependencies = thisHook.const.params[moduleName].dependencies.split(",");

        dependencies.forEach(function (dependency) {

          if (!thisHook.const.params[dependency] || thisHook.const.params[dependency].enabled === "false") {

            unmet.push(moduleName + " requires " + dependency);

          }

        })

      }

      delete thisHook.const.params[moduleName].enabled;
      delete thisHook.const.params[moduleName].dependencies;

      enabled.push(thisHook.const.params[moduleName]);

    }

  })

  if (unmet.length) {

    thisHook.finish(false, unmet.join("/n"));
    return false;

  }

  enabled.sort(function (a, b) {
    if (a.rank < b.rank)
      return -1;
    if (a.rank > b.rank)
      return 1;
    return 0;
  });

  enabled.forEach(function (currentModule) {

    delete currentModule.rank;

  })

  fs.writeFileSync(iris.sitePath + "/enabled_modules.json", JSON.stringify(enabled));

  process.send("restart");

  thisHook.finish(true, data)

});
