// Register menu item

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/themes", "Themes", 1);

iris.app.get("/admin/themes", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_themes"], ['admin_wrapper'], null, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.modules.admin_ui.registerHook("hook_form_render_themes", 0, function (thisHook, data) {

  // Find all themes

  var glob = require("glob");
  var path = require("path");
  var fs = require("fs");

  glob("{" + iris.rootPath + "/iris_core/themes/**/*.iris.theme" + "," + iris.sitePath + "/themes/**/*.iris.theme" + "," + iris.rootPath + "/home/themes/**/*.iris.theme" + "}", function (er, files) {

    var themes = {};
    var names = {};

    try {

      files.forEach(function (file) {

        var info = JSON.parse(fs.readFileSync(file, "utf8"));

        themes[file] = info;

        names[file] = info.name;

      });

      data.schema.activeTheme = {
        type: "string",
        title: "Active theme",
        enum: Object.keys(themes)
      }

      data.form = [];

      data.form.push({
        key: "activeTheme",
        titleMap: names
      })

      data.form.push({
        type: "submit",
        title: "submit"
      })

      thisHook.finish(true, data);

    } catch (e) {

      console.log(e);

      thisHook.finish(false, e);

    }

  });

})

iris.modules.admin_ui.registerHook("hook_form_submit_themes", 0, function (thisHook, data) {

  thisHook.finish(true);

});
