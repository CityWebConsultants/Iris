C.registerModule("menu");

CM.menu.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("menu", data.html, function (menu, next) {
    
    CM.frontend.globals.findTemplate("menu", menu).then(function (yes) {

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
