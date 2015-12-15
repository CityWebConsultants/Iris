C.registerModule("menu");

// Get any already saved config

var fs = require('fs');
var glob = require("glob");

glob(C.configPath + "/menu/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    config = JSON.parse(config);

    if (config.menuName) {

      C.saveConfig(config, "menu", C.sanitizeFileName(config.menuName), function () {

        },
        function (fail) {

          console.log(fail);

        });
    }
  })

})

// Function for getting menu form

CM.menu.registerHook("hook_form_render_menu", 0, function (thisHook, data) {

  // Check if menu name supplied and previous values available

  if (thisHook.const.params[1]) {

    if (thisHook.const.params[1].indexOf("{") !== -1) {

      thisHook.finish(false, data);
      return false;

    } else {

      if (C.configStore["menu"] && C.configStore["menu"][thisHook.const.params[1]]) {

        data.value = C.configStore["menu"][thisHook.const.params[1]];

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
            "default": [],
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

CM.menu.registerHook("hook_form_submit_menu", 0, function (thisHook, data) {

  C.saveConfig(thisHook.const.params, "menu", C.sanitizeFileName(thisHook.const.params.menuName), function () {

    var data = function (res) {

      res.send("/admin")

    }

    thisHook.finish(true, data);

  }, function (fail) {

    console.log(fail);

  });

});

// Page for creating a new menu

C.app.get("/admin/menu/create", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_menu_form"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});

// Page for editing an existing menu

C.app.get("/admin/menu/edit/:menuName", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_menu_form_edit"], ['admin_wrapper'], {
    menuName: req.params.menuName
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});

// List of menus page

// Page for editing an existing menu

C.app.get("/admin/menu", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_menu_list"], ['admin_wrapper'], {
    menuList: C.configStore["menu"]
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});

// Default menu view function

CM.menu.registerHook("hook_view_menu", 0, function (thisHook, data) {

  thisHook.finish(true, data);

})

// Parse menu templates

CM.menu.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  var variables = data.variables;

  CM.frontend.globals.parseBlock("menu", data.html, function (menu, next) {

    var menuName = menu[0];

    C.readConfig("menu", menuName).then(function (output) {

      CM.frontend.globals.parseTemplateFile(["menu", menuName], null, {
        menu: output
      }, thisHook.authPass).then(function (html) {

        // Check if user can view menu

        C.hook("hook_view_menu", thisHook.authPass, menuName, menuName).then(function (access) {

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

CM.menu.globals.registerMenu = function (menuName) {

  if (!C.configStore["menu"]) {
    C.configStore['menu'] = {};
  }

  C.configStore['menu'][C.sanitizeFileName(menuName)] = {
    "menuName": menuName,
    "items": []
  };

}

CM.menu.globals.registerMenuLink = function (menuName, parentPath, path, title) {

  if (!C.configStore["menu"]) {

    return false;

  }

  if (!C.configStore['menu'][C.sanitizeFileName(menuName)]) {
    C.log("error", "no such menu - " + menuName)
    return false;
  } else {

    var menuConfig = C.configStore['menu'][C.sanitizeFileName(menuName)];

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
