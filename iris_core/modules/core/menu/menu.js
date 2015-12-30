iris.registerModule("menu");

// Get any already saved config

var fs = require('fs');
var glob = require("glob");

glob(iris.configPath + "/menu/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    config = JSON.parse(config);

    if (config.menuName) {

      iris.saveConfig(config, "menu", iris.sanitizeFileName(config.menuName), function () {

        },
        function (fail) {

          console.log(fail);

        });
    }
  })

})

// Function for getting menu form

iris.modules.menu.registerHook("hook_form_render_menu", 0, function (thisHook, data) {

  // Check if menu name supplied and previous values available

  if (thisHook.const.params[1]) {

    if (thisHook.const.params[1].indexOf("{") !== -1) {

      thisHook.finish(false, data);
      return false;

    } else {

      if (iris.configStore["menu"] && iris.configStore["menu"][thisHook.const.params[1]]) {

        data.value = iris.configStore["menu"][thisHook.const.params[1]];

      }

    }

  }

  // Create form for menus

  data.schema = {
    "menuName": {
      "type": "text",
      "title": "Menu title"
    },
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": {
            "type": "text",
            "title": "Title"
          },
          "path": {
            "type": "text",
            "title": "path"
          },
          "children": {
            "type": "array",
            "title": "Children",
            "items": {
              "type": "object",
              "properties": {
                "title": {
                  "type": "text",
                  "title": "Title"
                },
                "path": {
                  "type": "text",
                  "title": "path"
                },
              }
            }
          }
        }
      }
    }
  }

  // Hide menu title if editing

  if (data.value.menuName) {

    data.schema.menuName.type = "hidden";

  }

  thisHook.finish(true, data);

})

iris.modules.menu.registerHook("hook_form_submit_menu", 0, function (thisHook, data) {

  // Remove blank items. TODO, this should be automatic. How come it's getting stuck?

  if (thisHook.const.params.items) {

    thisHook.const.params.items.forEach(function (menuitem, index) {

      var item = thisHook.const.params.items[index];

      if (item.children) {

        item.children.forEach(function (child, childindex) {

          if (!child.path || !child.title) {

            item.children.splice(childindex, 1);

          }

        })

      }

    })

  }

  iris.saveConfig(thisHook.const.params, "menu", iris.sanitizeFileName(thisHook.const.params.menuName), function () {

    var data = function (res) {

      res.send("/admin")

    }

    thisHook.finish(true, data);

  }, function (fail) {

    console.log(fail);

  });

});

// Page for creating a new menu

iris.app.get("/admin/menu/create", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_menu_form"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

// Page for editing an existing menu

iris.app.get("/admin/menu/edit/:menuName", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_menu_form_edit"], ['admin_wrapper'], {
    menuName: req.params.menuName
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

// List of menus page

// Page for editing an existing menu

iris.app.get("/admin/menu", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_menu_list"], ['admin_wrapper'], {
    menuList: iris.configStore["menu"]
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

// Default menu view function

iris.modules.menu.registerHook("hook_view_menu", 0, function (thisHook, data) {

  thisHook.finish(true, data);

})

// Parse menu templates

iris.modules.menu.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  var variables = data.variables;

  iris.modules.frontend.globals.parseEmbed("menu", data.html, function (menu, next) {

    var menuName = menu[0];

    iris.readConfig("menu", menuName).then(function (output) {

      iris.modules.frontend.globals.parseTemplateFile(["menu", menuName], null, {
        menu: output
      }, thisHook.authPass).then(function (html) {

        // Check if user can view menu

        iris.hook("hook_view_menu", thisHook.authPass, menuName, menuName).then(function (access) {

          next(html);

        }, function (noaccess) {

          next("<!-- " + menuName + "-->");

        })

      }, function (fail) {

        next(false);

      })

    }, function (fail) {

      next(false);

    });

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    thisHook.finish(true, data);

  });

});

// Programatic menu generation functions

iris.modules.menu.globals.registerMenu = function (menuName) {

  if (!iris.configStore["menu"]) {
    iris.configStore['menu'] = {};
  }

  iris.configStore['menu'][iris.sanitizeFileName(menuName)] = {
    "menuName": menuName,
    "items": []
  };

}

iris.modules.menu.globals.registerMenuLink = function (menuName, parentPath, path, title) {

  if (!iris.configStore["menu"]) {

    return false;

  }

  if (!iris.configStore['menu'][iris.sanitizeFileName(menuName)]) {
    iris.log("error", "no such menu - " + menuName)
    return false;
  } else {

    var menuConfig = iris.configStore['menu'][iris.sanitizeFileName(menuName)];

    if (parentPath) {

      menuConfig.items.forEach(function (item) {

        if (item.path === parentPath) {

          if (!item.children) {

            item.children = [];

          }

          item.children.push({
            title: title,
            path: path
          });

        }

      })

    } else {

      menuConfig.items.push({
        title: title,
        path: path
      });

    }
  }
}
