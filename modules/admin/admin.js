var express = require('express');
var cookieParser = require('cookie-parser')
C.app.use(cookieParser());
var path = require('path');

C.registerModule("admin");

CM.admin.globals.auth;

C.app.post("/admin/login", function (req, res) {

  if (req.body.secretkey === C.config.secretkey && req.body.apikey === C.config.apikey) {

    CM.admin.globals.auth = Math.random();

    res.cookie('auth', auth, {
      maxAge: 20000
    });

  } else {

    res.redirect("/admin");

  }

});

C.app.get("/admin", function (req, res) {

  if (CM.admin.globals.auth && req.cookies.auth == CM.admin.globals.auth) {

    res.sendFile(path.join(__dirname, '/templates/', 'admin.html'));

  } else {

    res.respond(400, "Access Denied", "No access to admin");

  }

});
