// Register menu item

iris.route.get("/admin/themes", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Themes"
  }]
}, function (req, res) {

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

iris.modules.system.registerHook("hook_form_render__themes", 0, function (thisHook, data) {

  // Find all themes

  var glob = require("glob");
  var path = require("path");
  var fs = require("fs");

  glob("{" + iris.rootPath + "/iris_core/themes/**/*.iris.theme" + "," + iris.sitePath + "/themes/**/*.iris.theme" + "," + iris.rootPath + "/home/themes/**/*.iris.theme" + "}", function (er, files) {

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
        title: "Active theme",
        default: iris.modules.frontend.globals.activeTheme ? iris.modules.frontend.globals.activeTheme.name : null,
        enum: machineNames,
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

      thisHook.pass( data);

    } catch (e) {

      console.log(e);

      thisHook.fail( e);

    }

  });

})

var path = require("path");
var fs = require("fs");

iris.modules.system.registerHook("hook_form_submit__themes", 0, function (thisHook, data) {

  iris.message(thisHook.authPass.userid, "theme config changed ", "success");

  var output = {
    name: thisHook.context.params.activeTheme
  }

  fs.writeFileSync(iris.sitePath + "/active_theme.json", JSON.stringify(output));

  iris.restart(thisHook.authPass.userid, "themes page");

  thisHook.pass( data);

});
