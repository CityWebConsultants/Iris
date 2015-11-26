C.registerModule("menu2");

// Function for getting menu form

CM.menu2.registerHook("hook_form_render_menu", 0, function (thisHook, data) {

  // Check if menu name supplied and previous values available

  var values = {};

  if (thisHook.const.params[1]) {

    if (thisHook.const.params[1].indexOf("{") !== -1) {

      thisHook.finish(false, data);
      return false;

    } else {

      if (C.configStore["menu"] && C.configStore["menu"][thisHook.const.params[1]]) {

        values = C.configStore["menu"][thisHook.const.params[1]].menu;

      }

    }

  }

  // Create form for menus

  data.schema = {
    "menuTitle": {
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
            "default": [],
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

})

CM.menu2.registerHook("hook_form_submit_menu", 0, function (thisHook, data) {

  C.saveConfig(thisHook.const.params, "menu", C.sanitizeFileName(thisHook.const.params.menuName), function () {

    var data = function (res) {

      res.send("/admin")

    }

    thisHook.finish(true, data);

  }, function (fail) {

    console.log(fail);

  });

});

// Page for creating a new menu

C.app.get("/admin/menu", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_menu_form"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});

// Page for editing an existing menu

C.app.get("/admin/menu/edit/:menuName", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    CM.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["admin_menu_form_edit"], ['admin_wrapper'], {
    menuName: req.params.menuName
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

});
