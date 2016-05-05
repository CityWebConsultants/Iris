/**
 * Embed for [[[menu __]]] menus made using the UI.
 */

iris.modules.menu_ui.registerHook("hook_frontend_embed__menu", 2, function (thisHook, data) {

  var menuName = thisHook.context.embedID;

  iris.readConfig('menu', menuName).then(function (config) {

    iris.modules.frontend.globals.parseTemplateFile(["menu", menuName], null, {
      menu: config.items,
      menuName: menuName
    }, thisHook.authPass).then(function (html) {

      // Check if user can view menu

      iris.invokeHook("hook_view_menu", thisHook.authPass, menuName, menuName).then(function (access) {

        thisHook.pass(html);

      }, function (noaccess) {

        thisHook.fail(noaccess);

      })

    }, function (fail) {

      thisHook.fail(fail);

    })

  }, function (fail) {

    thisHook.pass(data);

  });

})

/**
 * Function for getting menu add/edit form.
 */

iris.modules.menu_ui.registerHook("hook_form_render__menu", 0, function (thisHook, data) {

  // Check if menu name supplied and previous values available
  var ap = thisHook.authPass;
  
  var menuId = thisHook.context.params;
  
  iris.readConfig('menu', menuId).then(function (config) {

    data.value = config;

    // Create form for menus

    data.schema = {
      "menuName": {
        "type": "text",
        "title": ap.t("Menu title")
      },
      "items": {
        "type": "array",
        "title": "Menu links",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "text",
              "title": ap.t("Title")
            },
            "path": {
              "type": "text",
              "title": ap.t("path")
            },
            "children": {
              "type": "array",
              "title": ap.t("Children"),
              "items": {
                "type": "object",
                "properties": {
                  "title": {
                    "type": "text",
                    "title": ap.t("Title")
                  },
                  "path": {
                    "type": "text",
                    "title": ap.t("path")
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

    thisHook.pass(data);

  }, function (fail) {

    data.schema = {
      "menuName": {
        "type": "text",
        "title": ap.t("Menu title")
      },
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "text",
              "title": ap.t("Title")
            },
            "path": {
              "type": "text",
              "title": ap.t("path")
            },
            "children": {
              "type": "array",
              "title": ap.t("Children"),
              "items": {
                "type": "object",
                "properties": {
                  "title": {
                    "type": "text",
                    "title": ap.t("Title")
                  },
                  "path": {
                    "type": "text",
                    "title": ap.t("path")
                  },
                }
              }
            }
          }
        }
      }
    }

    thisHook.pass(data);

  });

});

/**
 * Form submit handler for menu add/edit form.
 */

iris.modules.menu_ui.registerHook("hook_form_submit__menu", 0, function (thisHook, data) {

  // Remove blank items. TODO, this should be automatic. How come it's getting stuck?

  if (thisHook.context.params.items) {

    thisHook.context.params.items.forEach(function (menuitem, index) {

      var item = thisHook.context.params.items[index];

      if (item.children) {

        item.children.forEach(function (child, childindex) {

          if (!child.path || !child.title) {

            item.children.splice(childindex, 1);

          }

        })

      }

    })

  }

  iris.saveConfig(thisHook.context.params, "menu", iris.sanitizeName(thisHook.context.params.menuName), function () {

    var data = function (res) {

      res.json({
        redirect: "/admin/structure/menu"
      });

    }

    thisHook.pass(data);

  }, function (fail) {

    console.log(fail);

  });

});

/* 
 * Page callback for creating a new menu.
 */

iris.app.get("/admin/structure/menu/create", function (req, res) {

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

/**
 * Page for editing an existing menu.
 */

iris.app.get("/admin/structure/menu/edit/:menuName", function (req, res) {

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

/**
 * Page for deleting an existing menu.
 */

iris.app.get("/admin/structure/menu/delete/:menuName", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_menu_form_delete"], ['admin_wrapper'], {
    menuName: req.params.menuName
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

/**
 * Form for deleting an existing menu.
 */

iris.modules.menu.registerHook("hook_form_render__menu_delete", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["menuName"] = {
    type: "hidden",
    default: thisHook.context.params[1]
  };

  thisHook.pass(data);

});

/**
 * Menu delete form submit handler.
 */

iris.modules.menu.registerHook("hook_form_submit__menu_delete", 0, function (thisHook, data) {

  var menu = iris.sanitizeName(thisHook.context.params.menuName);

  iris.deleteConfig("menu", menu, function (err) {

    var data = function (res) {

      res.json({
        redirect: "/admin/structure/menu"
      });

    };

    thisHook.pass(data);

  });

});


iris.modules.menu_ui.globals.getMenuList = function () {

  return new Promise(function (pass) {

    var fs = require("fs");

    fs.readdir(iris.configPath + "/menu", function (err, savedMenus) {

        var menus = [];

        if (!err && savedMenus) {

          savedMenus.map(function (menu) {

            menus.push(menu.replace(".json", ""));

          })

        }

        pass(menus);

      }

    )
  })
}

/**
 * List of menus page.
 * Page for editing an existing menu.
 */

iris.route.get("/admin/structure/menu", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: "/admin/structure",
    title: "Menu"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.menu_ui.globals.getMenuList().then(function (menuList) {

    iris.modules.frontend.globals.parseTemplateFile(["admin_menu_list"], ['admin_wrapper'], {
      menuList: menuList
    }, req.authPass, req).then(function (success) {

      res.send(success)

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", e);

    });

  })

});
