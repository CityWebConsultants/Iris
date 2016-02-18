/**
 * @file Methods and hooks to implement menus for navigation and categorisation
 */

/**
 * @namespace menu
 */

iris.registerModule("menu");

// These should be removed as soon as admin menu links are all ported over

iris.modules.menu.globals.registerMenuLink = function () {};
iris.modules.menu.globals.registerMenu = function () {};

iris.route.get("/hello", {
  "menu": [{
    menuName: "what",
    parent: null,
    path: "/about",
    title: "Hi!"
  }]
}, function (req, res) {

  res.send("Hello");

}, 5);

iris.modules.menu.registerHook("hook_frontend_embed__menu", 0, function (thisHook, data) {

  // Loop over Iris routes

  var menuName = thisHook.const.embedParams[0];

  var menuItems = [];

  Object.keys(iris.routes).forEach(function (path) {

    if (iris.routes[path].get) {

      var route = iris.routes[path].get;

      if (route.options && route.options.menu && route.options.menu.length) {

        // Route has a menu

        route.options.menu.forEach(function (menu) {

          if (menu.menuName === menuName) {


            if (!menu.path) {
              menu.path = path;
            }
            menuItems.push(menu);

          }

        })

      }

    }

  })

  // Generate menu

  var menuLinks = [];

  // Top level items first

  menuItems.forEach(function (item) {

    if (!item.parent) {

      item.children = [];

      menuLinks.push(item);

    }

  })

  // Then parent items

  menuItems.forEach(function (item) {

    if (item.parent) {

      menuLinks.forEach(function (menuItem) {

        if (menuItem.path === item.parent) {

          menuItem.children.push(item);

        }

      })

    }

  })

  // Menu ready, check access

  iris.modules.frontend.globals.parseTemplateFile(["menu", menuName], null, {
    menu: menuLinks
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

})

/**
 * Get any already saved config.
 */

var fs = require('fs');
var glob = require("glob");

glob(iris.configPath + "/menu/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    config = JSON.parse(config);

    if (config.menuName) {

      iris.saveConfig(config, "menu", iris.sanitizeName(config.menuName), function () {

        },
        function (fail) {

          console.log(fail);

        });
    }
  })

})

/**
 * Function for getting menu add/edit form.
 */

iris.modules.menu.registerHook("hook_form_render_menu", 0, function (thisHook, data) {

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

  iris.saveConfig(thisHook.const.params, "menu", iris.sanitizeName(thisHook.const.params.menuName), function () {

    var data = function (res) {

      res.send("/admin")

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

iris.app.get("/admin/structure/menu", function (req, res) {

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

/**
 * Default menu view function.
 * Used to check permissions.
 */
iris.modules.menu.registerHook("hook_view_menu", 0, function (thisHook, data) {

  if (thisHook.const !== "admin_toolbar") {

    thisHook.finish(true, thisHook.const);

    return false;

  }

  if (iris.modules.auth.globals.checkPermissions(["can view admin menu"], thisHook.authPass)) {

    thisHook.finish(true, thisHook.const);

  } else {

    thisHook.finish(false, thisHook.const);

  }

});
