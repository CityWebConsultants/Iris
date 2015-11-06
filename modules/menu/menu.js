C.registerModule("menu");

CM.auth.globals.registerPermission("can view menus", "menu");

CM.menu.registerHook("hook_menu_view", 0, function (thisHook, menuName) {

  thisHook.finish(true, menuName);

});

// Register template

CM.frontend.globals.templateRegistry.external.push(__dirname + '/templates');

CM.menu.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("menu", data.html, function (menu, next) {

    C.hook("hook_menu_view", thisHook.authPass, null, menu).then(function (canView) {

      CM.frontend.globals.findTemplate(["menu", menu]).then(function (html) {

        C.dbCollections.menu.findOne({
          'title': menu
        }, function (err, doc) {

          C.hook("hook_frontend_template", thisHook.authPass, null, {
            html: html,
            vars: {
              menu: doc
            }
          }).then(function (success) {

            next(success.html);

          }, function (fail) {

            next(html)

          });

        });

      }, function (fail) {

        next("<!-- No menu template -->");

      });

    }, function (fail) {

      next("<!-- No permission to view this -->");

    });

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    thisHook.finish(true, data);

  });

});

var waitingMenuItems = [];

CM.menu.globals.registerMenuItem = function (menuName, path, title) {

  waitingMenuItems.push({
    menuName: menuName,
    path: path,
    title: title
  });

};

process.on("dbReady", function () {

  var promises = [];

  waitingMenuItems.forEach(function (element, index) {

    promises.push(C.promise(function (data, yes, no) {

      C.dbCollections.menu.findOne({
        'title': element.menuName
      }, function (err, doc) {

        if (doc) {

          // Item already exists

          if (doc.menulink.some(function (currentValue, index) {

              return currentValue.path === element.path;

            })) {

            // Path already present - don't need to do anything

            waitingMenuItems.splice(index, 1);
            yes(data);
            return false;

          }

          // Update menu to place this link in it

          C.dbCollections.menu.update({
            "title": element.menuName
          }, {
            "$addToSet": {
              "menulink": {
                "title": element.title,
                "path": element.path
              }
            }
          }, {
            "upsert": true
          }, function (err, data) {

          });

          waitingMenuItems.splice(index, 1);
          yes(data);

        } else {

          // Create a new menu

          var entity = new C.dbCollections.menu({
            title: element.menuName,
            entityAuthor: "system",
            entityType: "menu",
            menulink: [{
              title: element.title,
              path: element.path
            }]
          });

          entity.save(function (err, doc) {

            if (err) {
              console.log(err)
            }

            waitingMenuItems.splice(index, 1);
            yes(data);

          });

        }

      });

    }));

  });

  C.promiseChain(promises, {}, function () {});

});
