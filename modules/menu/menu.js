C.registerModule("menu");

CM.menu.registerHook("hook_frontend_template_parse2", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("menu", data, function (menu, next) {
    
    CM.frontend.globals.findTemplate("menu", menu).then(function (yes) {

      next(yes);

    }, function (fail) {

      next("<!-- No menu template -->");

    });

  }).then(function (html) {

    thisHook.finish(true, html);

  }, function (fail) {

    console.log(fail);
    thisHook.finish(true, data);

  });

});
