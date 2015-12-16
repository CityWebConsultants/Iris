iris.registerModule("sessions");

iris.app.get("/checkauth", function (req, res) {

  res.respond(200, req.authPass.userid);

});

iris.modules.sessions.registerHook("hook_auth_authpass", 2, function (thisHook, data) {

  if (thisHook.req && thisHook.req.cookies && thisHook.req.cookies.userid && thisHook.req.cookies.token) {

    if (iris.modules.auth.globals.checkAccessToken(thisHook.req.cookies.userid, thisHook.req.cookies.token)) {

      data.userid = thisHook.req.cookies.userid;
      data.roles.push("authenticated");

    }

  }

  thisHook.finish(true, data);

});

iris.modules.sessions.globals.writeCookies = function (userid, token, res, maxAge, options) {

  var cookieOptions = {};

  if (maxAge) {
    cookieOptions.maxAge = maxAge
  }

  res.cookie('userid', userid, cookieOptions);
  res.cookie('token', token, cookieOptions);

};
