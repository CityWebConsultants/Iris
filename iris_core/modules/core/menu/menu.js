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

  var menuName = thisHook.const.embedParams[0];

  var menuItems = [];

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

        })

      }

    }

  })

  // Order by weight

  menuItems.sort(function (a, b) {

    if (a.weight < b.weight) {

      return -1;

    } else if (a.weight > b.weight) {

      return 1;

    } else {

      return 0;

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

  if (menuLinks.length) {

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

  } else {

    thisHook.finish(true, "");

  }

})

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
