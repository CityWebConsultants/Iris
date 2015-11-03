var fs = require('fs');

CM.admin_ui.globals.registerPath = function (path, templateName) {

  C.app.get(path, function (req, res) {

    // If not admin, present login page
    if (req.authPass.roles.indexOf('admin') === -1) {

      if (req.url.indexOf('/admin/login') !== 0) {

        res.redirect('/admin/login?return=' + req.url);
        return false;

      }

    }

    // If admin going to login page, redirect
    if (req.url.indexOf('/admin/login') === 0) {

      if (req.authPass.roles.indexOf('admin') !== -1) {

        if (req.query.return) {

          res.redirect(req.query.return);

        } else {

          res.redirect('/');

        }

      }

    }

    CM.frontend.globals.findTemplate([templateName], "html").then(function (html) {

      var admin_wrapper = fs.readFileSync(__dirname + '/templates/admin.html', "utf8");

      html = admin_wrapper.replace('[[[ADMINCONTENT]]]', html);

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

CM.admin_ui.globals.registerPath("/admin/login", "admin_login");
CM.admin_ui.globals.registerPath("/admin", "admin_dashboard");
CM.admin_ui.globals.registerPath("/admin/permissions", "admin_permissions");
CM.admin_ui.globals.registerPath("/admin/entities", "admin_entity_types");
CM.admin_ui.globals.registerPath("/admin/schema/create", "admin_schema_create");
CM.admin_ui.globals.registerPath("/admin/schema/edit/:type", "admin_schema_edit");
CM.admin_ui.globals.registerPath("/admin/edit/:type/:_id", "admin_entity_edit");
CM.admin_ui.globals.registerPath("/admin/create/:type", "admin_entity_create");
CM.admin_ui.globals.registerPath("/admin/delete/:type/:id", "admin_entity_delete");
