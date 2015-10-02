C.registerModule("admin");

var express = require('express');

//Register static directory

C.app.use("/admin", express.static(__dirname + '/static'));

CM.admin.globals = {

  adminToken: "",
  checkAdmin: function (req) {

    if (req.cookies) {
      return req.cookies.auth == CM.admin.globals.adminToken;
    }

  }

}

var fs = require('fs');

C.app.get("/modules", function (req, res) {

  // GLOB search for modules

  var glob = require("glob")

  glob("{modules/**/*.iris" + "," + "node_modules/**/*.iris}", {
    cwd: C.rootPath,
    matchBase: true
  }, function (er, files) {

    var enabled = [];

    files.forEach(function (availableModule, index) {

      enabled.push({

        "name": availableModule,
        "path": files[index].replace(".iris", ".js")

      });

    });

    fs.writeFileSync(C.sitePath + "/enabled_modules.json", JSON.stringify(enabled), "utf8");

    res.send(enabled);

  })

});

CM.admin.registerHook("hook_auth_authpass", 1, function (thisHook, data) {

  if (thisHook.req && thisHook.req.cookies && thisHook.req.cookies.auth == CM.admin.globals.adminToken) {

    data.roles.push("admin");

  }

  thisHook.finish(true, data);

});

require("./menu.js");

require("./entityforms.js");

require("./permissions.js");

require("./logs.js");

var path = require('path');

C.app.get("/admin", function (req, res) {

  if (CM.admin.globals.checkAdmin(req)) {

    res.sendFile(path.join(__dirname, '/templates/', 'admin.html'));

  } else {

    res.sendFile(path.join(__dirname, '/templates/', 'login.html'));

  }


});

C.app.get("/admin/logout", function (req, res) {

  CM.admin.globals.adminToken = "";
  res.redirect("/admin");

});

C.app.post("/admin/login", function (req, res) {

  if (req.body.secretkey === C.config.secretkey && req.body.apikey === C.config.apikey) {

    CM.admin.globals.adminToken = Math.random();

    res.cookie('auth', CM.admin.globals.adminToken, {
      //      maxAge: 200000
    });

    res.redirect("/admin");

  } else {

    res.redirect("/admin/login");

  }

});
