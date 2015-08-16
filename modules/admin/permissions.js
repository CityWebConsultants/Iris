var fs = require('fs');

C.app.get("/permissions", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    var current = {};

    try {
      var currentPermissions = fs.readFileSync(CM.auth.configPath + "/permissions.JSON", "utf8");

      current = JSON.parse(currentPermissions);

    } catch (e) {

      console.log(e);

    }

    res.send({

      current: current,
      permissions: CM.auth.globals.permissions,
      roles: CM.auth.globals.roles


    });

  } else {

    res.respond(403, "Access denied");

  }


});

C.app.get("/admin/permissions", function (req, res) {

  var path = require('path');

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, 'permissions.html'));

  } else {

    res.redirect("/admin");

  }

});


C.app.post("/admin/permissions", function (req, res) {

  fs.writeFile(C.configPath + "/auth/permissions.JSON", JSON.stringify(req.body), "utf8", function (err, data) {

    if (err) {

      res.send("error");

    } else if (data) {

      res.send("success");

    } else res.send("fail");

  })

});
