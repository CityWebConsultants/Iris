/**
 * @file Methods and hooks to implement menus for navigation and categorisation
 */

/**
 * @namespace menu
 */

iris.registerModule("menu",__dirname);

/**
 * Embed function for [[[menu __]]] embeds.
 * This is for those registered through iris.route.
 */

iris.modules.menu.registerHook("hook_frontend_embed__menu", 0, function (thisHook, data) {

  var menuName = thisHook.context.embedID;

  var menuItems = [];

  var embedOptions = thisHook.context.embedOptions;

  Object.keys(iris.routes).forEach(function (path) {

    if (iris.routes[path].get) {

      var route = iris.routes[path].get;

      if (route.options && route.options.menu && route.options.menu.length) {

        // Route has a menu

        route.options.menu.forEach(function (menu) {
          
          if (menu.menuName === menuName) {

            if (!menu.weight) {

              menu.weight = 0;

            }

            if (!menu.path) {
              menu.path = path;
            }
            menuItems.push(menu);

          }

        });

      }

    }

  });
  
  // Order by path

  menuItems.sort(function (a, b) {
    if (!a.parent) {
      a.parent = '';
    }
    if (!b.parent) {
      b.parent = '';
    }
    if ((a.parent.match(/\//g) || []).length < (b.parent.match(/\//g) || []).length) {

      return -1;

    } else if ((a.parent.match(/\//g) || []).length > (b.parent.match(/\//g) || []).length) {

      return 1;

    } else {

      return 0;

    }

  });


  // Generate menu

  var menuLinks = [];

  // Top level items first

  var fillMenu = function () {
    var MenuTree = [];

    var isItemExist = function (arr, item) {
      var found = false;
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && (arr[i].path == item.path)) {
           found = true;
           break;
        }
      }
      return found;
    };

    var findParent = function (menu, item) {

      if (item.parent) {
        menu.forEach(function (data) {
          if (data.path === item.parent) {
            if (data.children && data.children.length) {
              if (!isItemExist(data.children, item)) {
                data.children.push(item);
              }

            }
            else {
              data.children = [item];

            }
          }
          else {
            if (data.children && data.children.length) {
              findParent(data.children, item);
            }
          }
        });
      }
      else {

        if (!isItemExist(menu, item)) {
          menu.push(item);
        }

      }
    };

    menuItems.forEach(function (item) {
      findParent(MenuTree, item);
    });

    return MenuTree;
  };

  var MenuTreeArray = fillMenu();

  var sort = function (a, b) {

    if (a.weight < b.weight) {

      return -1;

    } else if (a.weight > b.weight) {

      return 1;

    } else {

      return 0;

    }

  };

  var recursiveSort = function(menu) {

    menu.forEach(function(item) {

      if (item.children) {

        item.children.sort(sort);
        recursiveSort(item.children);

      }

    });

  };

  MenuTreeArray.sort(sort);

  recursiveSort(MenuTreeArray);

  if (MenuTreeArray.length) {

    // Menu ready, check access
    var parseTemplate = ["menu", menuName];

    if (embedOptions && embedOptions.template !== undefined) {
      parseTemplate.push(embedOptions.template);
    }

    iris.modules.frontend.globals.parseTemplateFile(parseTemplate, null, {
      menuName: menuName,
      menu: MenuTreeArray
    }, thisHook.authPass).then(function (html) {

      // Check if user can view menu

      iris.invokeHook("hook_view_menu", thisHook.authPass, menuName, menuName).then(function (access) {

        thisHook.pass(html);

      }, function (noaccess) {

        thisHook.pass("");

      });

    }, function (fail) {

      thisHook.fail(fail);

    });

  } else {

    thisHook.pass("");

  }

});

/**
 * Default menu view function.
 * Used to check permissions.
 */

iris.modules.menu.registerHook("hook_view_menu", 0, function (thisHook, data) {

  if (thisHook.context !== "admin_toolbar" && thisHook.context !== "admin_sidebar") {

    thisHook.pass(thisHook.context);

    return false;

  }

  if (iris.modules.auth.globals.checkPermissions(["can view admin menu"], thisHook.authPass)) {

    thisHook.pass(thisHook.context);

  } else {

    thisHook.fail(thisHook.context);

  }

});

/**
 * Get child links for a route.
 * Useful on top level menu landing pages.
 */

iris.modules.menu.globals.getBaseLinks = function (baseurl) {

  var links = [];

  if (baseurl) {

    // Find other matching routes

    Object.keys(iris.routes).forEach(function (routePath) {

      var route = iris.routes[routePath];
      if (route.get && route.get.options && route.get.options.menu) {

        var menu = route.get.options.menu;

        var url = require("url");

        var basePath = url.parse(baseurl).pathname;

        menu.forEach(function (menuLink) {

          if (menuLink.parent && menuLink.parent === basePath) {

            links.push({
              path: routePath,
              title: menuLink.title,
              description: route.get.options.description ? route.get.options.description : ''
            });

          }

        });

      }

    });

    links.sort(function (a, b) {

      a = a.path.split("/").length;
      b = b.path.split("/").length;

      if (a > b) {

        return 1;

      } else if (a < b) {

        return -1;

      } else {

        return 0;
      }

    });

  }

  return {
    name: baseurl,
    links: links
  };

};

iris.modules.menu.registerHook("hook_frontend_handlebars_extend", 1, function (thisHook, Handlebars) {

  iris.modules.frontend.globals.findTemplate(["submenu"]).then(function (template) {

    Handlebars.registerPartial('submenu', template);
    thisHook.pass(Handlebars);
  });

  

});