// Admin login page

C.app.get("/admin2/login", function (req, res) {

  CM.frontend.globals.findTemplate(["admin_login"], "html").then(function (html) {

    CM.frontend.globals.parseTemplate(html, req.authPass).then(function (page) {

      res.send(page.html);

    });

  }, function () {

    error(req, res);

  });

});

C.app.get("/admin2/permissions", function (req, res) {

  CM.frontend.globals.findTemplate(["admin_permissions"], "html").then(function (html) {

    res.send(html);

  }, function () {

    error(req, res);

  });

});

C.app.get("/admin2/entities", function (req, res) {

  CM.frontend.globals.findTemplate(["admin_entity_types"], "html").then(function (html) {

    res.send(html);

  }, function () {

    error(req, res);

  });

});

var error = function (req, res) {

  res.send("Error loading template");

};
