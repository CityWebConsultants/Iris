var fs = require('fs');

C.app.get("/permissions", function (req, res) {

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


});

C.app.get("/admin/permissions", function (req, res) {

  var path = require('path');

  res.sendFile(path.join(__dirname, 'permissions.html'));

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
