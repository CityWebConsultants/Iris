/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

var path = require("path");
var fs = require("fs");

/**
 * Define callback routes.
 */
var routes = {
  themes: {
    title: "Themes",
    description: "Choose which frontend theme to use.",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: null,
      title: "Themes"
    }]
  },
};

/**
 * Admin page callback: Administer themes.
 */
iris.route.get("/admin/themes", routes.themes, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_themes"], ['admin_wrapper'], null, req.authPass, req).then(function (success) {

    iris.clearMessages(req.authPass.userid);
    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.modules.system.registerHook("hook_form_render__themes", 0, function (thisHook, data) {

  // Find all themes

  var glob = require("glob");
  var path = require("path");
  var fs = require("fs");

  glob("{" + iris.rootPath + "/themes/**/*.iris.theme" + "," + iris.sitePath + "/themes/**/*.iris.theme" + "}", function (er, files) {

    var names = {};
    var machineNames = [];

    try {

      var path = require("path");

      files.forEach(function (file) {

        var info = JSON.parse(fs.readFileSync(file), "utf8");

        var machineName = path.basename(file).replace(".iris.theme", "");

        var themeName = info.name;

        names[machineName] = themeName;
        machineNames.push(machineName);

      });

      data.schema.activeTheme = {
        type: "text",
        title: thisHook.authPass.t("Active theme"),
        default: iris.modules.frontend.globals.activeTheme ? iris.modules.frontend.globals.activeTheme.name : null,
        enum: machineNames,
      };

      data.form = [];

      data.form.push({
        key: "activeTheme",
        titleMap: names
      });

      data.form.push({
        type: "submit",
        title: "submit"
      });

      thisHook.pass(data);

    } catch (e) {

      console.log(e);

      thisHook.fail(e);

    }

  });

});

iris.modules.system.registerHook("hook_form_submit__themes", 0, function (thisHook, data) {

  iris.message(thisHook.authPass.userid, "theme config changed ", "success");

  var output = {
    name: thisHook.context.params.activeTheme
  };

  fs.writeFileSync(iris.configPath + "/system/active_theme.json", JSON.stringify(output));

  iris.restart(thisHook.authPass.userid, "themes page");

  thisHook.pass(data);

});
