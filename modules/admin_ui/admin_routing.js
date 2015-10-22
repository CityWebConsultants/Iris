CM.admin_ui.globals.registerPath = function (path, templateName) {

  C.app.get(path, function (req, res) {

    // If not admin, present login page
    if (req.authPass.roles.indexOf('admin') === -1) {

      if (req.url.indexOf('/admin2/login') !== 0) {

        res.redirect('/admin2/login?return=' + req.url);
        return false;

      }

    }

    // If admin going to login page, redirect
    if (req.url.indexOf('/admin2/login') === 0) {

      if (req.authPass.roles.indexOf('admin') !== -1) {

        if (req.query.return) {

          res.redirect(req.query.return);

        } else {

          res.redirect('/');

        }

      }

    }

    CM.frontend.globals.findTemplate([templateName], "html").then(function (html) {

      CM.frontend.globals.parseTemplate(html, req.authPass).then(function (page) {

        res.send(page.html);

      });

    }, function () {

      var error = function (req, res) {

        res.send("Error loading template");

      };

    });

  });

}

CM.admin_ui.globals.registerPath("/admin2/login", "admin_login");
CM.admin_ui.globals.registerPath("/admin2/permissions", "admin_permissions");
CM.admin_ui.globals.registerPath("/admin2/entities", "admin_entity_types");
CM.admin_ui.globals.registerPath("/admin2/schema/create", "admin_schema_create");
CM.admin_ui.globals.registerPath("/admin2/schema/edit/:type", "admin_schema_edit");
CM.admin_ui.globals.registerPath("/admin2/edit/:type/:_id", "admin_entity_edit");
CM.admin_ui.globals.registerPath("/admin2/create/:type", "admin_entity_create");
CM.admin_ui.globals.registerPath("/admin2/delete/:type/:id", "admin_entity_delete");
