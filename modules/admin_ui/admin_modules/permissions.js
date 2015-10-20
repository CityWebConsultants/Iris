var fs = require('fs');

C.app.get("/admin/api/permissions", function (req, res) {

  if (req.authPass.roles.indexOf('admin') !== -1) {

    var current = {};

    try {
      var currentPermissions = fs.readFileSync(CM.auth.configPath + "/permissions.JSON", "utf8");

      current = JSON.parse(currentPermissions);

    } catch (e) {

      fs.writeFileSync(CM.auth.configPath + "/permissions.JSON", JSON.stringify({}), "utf8");

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

var path = require('path');

CM.admin.globals.registerMenuItem("Permissions", path.join(__dirname, 'templates/permissions.html'));

C.app.post("/admin/api/permissions", function (req, res) {

  fs.writeFile(C.configPath + "/auth/permissions.JSON", JSON.stringify(req.body), "utf8", function (err, data) {

    if (err) {

      res.send("error");

    } else if (data) {

      res.send("success");

    } else {

      res.send("fail");

    }

  })

});
