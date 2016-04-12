/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

/**
 * @file Methods and hooks to implement menus for navigation and categorisation
 */

/**
 * @namespace menu
 */

iris.registerModule("menu");

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

  // Order by weight

  menuItems.sort(function (a, b) {

    if (a.weight < b.weight) {

      return -1;

    } else if (a.weight > b.weight) {

      return 1;

    } else {

      return 0;

    }

  });

  // Generate menu

  var menuLinks = [];

  // Top level items first

  menuItems.forEach(function (item) {

    if (!item.parent) {

      item.children = [];

      menuLinks.push(item);

    }

  });

  // Then parent items

  menuItems.forEach(function (item) {

    if (item.parent) {

      menuLinks.forEach(function (menuItem) {

        if (menuItem.path === item.parent) {

          menuItem.children.push(item);

        }

      });

    }

  });

  if (menuLinks.length) {

    // Menu ready, check access
    var parseTemplate = ["menu", menuName];

    if (embedOptions && embedOptions.template != undefined) {
      parseTemplate.push(embedOptions.template);
    }

    iris.modules.frontend.globals.parseTemplateFile(parseTemplate, null, {
      menuName: menuName,
      menu: menuLinks
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

          if (menuLink.parent && menuLink.parent.indexOf(basePath) !== -1) {

            links.push({
              path: routePath,
              title: menuLink.title
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
