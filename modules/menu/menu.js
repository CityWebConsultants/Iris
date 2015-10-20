C.registerModule("menu");

CM.menu.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("menu", data.html, function (menu, next) {

    CM.frontend.globals.findTemplate(["menu", menu]).then(function (yes) {

      next(yes);

    }, function (fail) {

      next("<!-- No menu template -->");

    });

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    console.log(fail);
    thisHook.finish(true, data);

  });

});

CM.menu.globals.registerMenuItem = function (menuName, path, title) {

  C.dbCollections.menu.findOne({
    'title': menuName
  }, function (err, doc) {

    if (doc) {

      if (doc.menulink.some(function (currentValue, index) {

          return currentValue.path === path;

        })) {

        return false;

      }

      C.dbCollections.menu.update({
          "title": menuName
        }, {
          "$addToSet": {
            "menulink": {
              "title": "hello",
              "path": "/"
            }
          }
        }, {
          "upsert": true
        },
        function (err, data) {

          console.log(err, data);

        }
      )

    } else {

      var entity = new C.dbCollections.menu({
        title: menuName,
        entityAuthor: "system",
        entityType: "menu",
        menulink: [{
          title: title,
          path: path
              }]
      });

    }

  })
};
