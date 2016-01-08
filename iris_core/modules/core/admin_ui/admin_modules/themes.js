// Register menu item

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/themes", "Themes", 1);

iris.app.get("/admin/themes", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_themes"], ['admin_wrapper'], null, req.authPass, req).then(function (success) {

    iris.clearMessages(req.authPass.userid);
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

        file = path.dirname(file.replace(iris.rootPath, ""));

        themes[file] = info;

        names[file] = info.name + " " + "(" + file + ")";

      });

      data.schema.activeTheme = {
        type: "string",
        title: "Active theme",
        enum: Object.keys(themes),
        default: iris.modules.frontend.globals.activeTheme ? iris.modules.frontend.globals.activeTheme.path.replace(iris.rootPath, "") : ""
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

var path = require("path");
var fs = require("fs");

iris.modules.admin_ui.registerHook("hook_form_submit_themes", 0, function (thisHook, data) {
  

  // Try to set theme

  var themePath = thisHook.const.params.activeTheme;

  var themeName = path.basename(themePath).replace(".iris.theme", "");

  iris.message(thisHook.authPass.userid, themeName + " theme enabled ", "status");

  fs.writeFileSync(iris.sitePath + "/active_theme.json", JSON.stringify({
    name: themeName,
    path: themePath
  }))

  var setTheme = iris.modules.frontend.globals.setActiveTheme(themePath, themeName);

  iris.restart(thisHook.authPass.userid, "themes page");

  thisHook.finish(true);

});
