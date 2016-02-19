/**
 * Embed for [[[menu __]]] menus made using the UI.
 */

iris.modules.menu_ui.registerHook("hook_frontend_embed__menu", 2, function (thisHook, data) {

  var menuName = thisHook.const.embedParams[0];

  iris.readConfig('menu', menuName).then(function (config) {

    iris.modules.frontend.globals.parseTemplateFile(["menu", menuName], null, {
      menu: config.items
    }, thisHook.authPass).then(function (html) {

      // Check if user can view menu

      iris.hook("hook_view_menu", thisHook.authPass, menuName, menuName).then(function (access) {

        thisHook.finish(true, html);

      }, function (noaccess) {

        thisHook.finish(false, noaccess);

      })

    }, function (fail) {

      thisHook.finish(false, fail);

    })

  }, function (fail) {

    thisHook.finish(true, data);

  });

})

/**
 * Function for getting menu add/edit form.
 */

iris.modules.menu_ui.registerHook("hook_form_render_menu", 0, function (thisHook, data) {

  // Check if menu name supplied and previous values available

  if (thisHook.const.params[1] && thisHook.const.params[1].indexOf("{") !== -1) {

    thisHook.finish(false, data);
    return false;

  } else {

    iris.readConfig('menu', thisHook.const.params[1]).then(function (config) {

      data.value = config;

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

    }, function (fail) {

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

      thisHook.finish(true, data);

    });

  }

});

/**
 * Form submit handler for menu add/edit form.
 */

iris.modules.menu_ui.registerHook("hook_form_submit_menu", 0, function (thisHook, data) {

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

  iris.saveConfig(thisHook.const.params, "menu", iris.sanitizeName(thisHook.const.params.menuName), function () {

    var data = function (res) {

      res.json({
        redirect: "/admin"
      });

    }

    thisHook.finish(true, data);

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

  iris.modules.frontend.globals.parseTemplateFile(["admin_menu_list"], ['admin_wrapper'], {
    menuList: iris.configStore["menu"]
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});
